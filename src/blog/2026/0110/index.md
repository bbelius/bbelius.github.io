---
publish: true
tpl: blog
title: BBelius.YARP.ReverseProxy.IPFilters
subtitle: Developer Reference
author: Benjamin Belikov
date: 2026-01-10
description: A customizable IP filtering middleware for YARP, providing fine-grained control over allowed or blocked IPs globally and per-route.
tags: ["dotnet", "yarp", "infra"]
category: projects
picture: /img/blog/0815.jpg
---

A customizable IP filtering middleware for Microsoft's [YARP](https://microsoft.github.io/reverse-proxy/) (Yet Another Reverse Proxy) that provides fine-grained control over allowed or blocked IP addresses globally and per-route.

&github& [GitHub Repository](https://github.com/bbelius/YARP.ReverseProxy.IPFilters) | &package& [NuGet Package](https://www.nuget.org/packages/BBelius.Yarp.ReverseProxy.IPFilters)

---

### Features

!features Core Features
* global-filtering | globe | Global IP Filtering
/ Policies apply to all routes
  Define policies that apply across your entire reverse proxy, blocking or allowing IPs before they reach any backend.

* route-filtering | route | Route-Specific Policies
/ Per-route granularity
  Assign different IP policies to individual routes via YARP's metadata system.

* dual-modes | shield | BlockList & AllowList
/ Flexible filtering modes
  **BlockList** denies specified IPs while allowing all others. **AllowList** permits only specified IPs, blocking the rest.

* dynamic-reload | refresh-cw | Dynamic Configuration
/ No restarts required
  Configuration changes are picked up automatically without restarting your application.

* tracing | activity | Activity Tracing
/ v1.4.0+
  Built-in Activity source (`BBelius.Yarp.ReverseProxy.IPFilters`) for distributed tracing integration.
!/features

---

### Installation

```bash
dotnet add package BBelius.Yarp.ReverseProxy.IPFilters
```

---

### Quick Start

#### #step-1 1. Register Services

```csharp Program.cs
using BBelius.Yarp.ReverseProxy.IPFilters;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

builder.Services.AddIPFilterPolicies(builder.Configuration);
```

#### #step-2 2. Add Middleware

```csharp Program.cs
var app = builder.Build();

app.MapReverseProxy(proxyPipeline =>
{
    proxyPipeline.UseIPFilterPolicies(); // Add before other middleware
    proxyPipeline.UseLoadBalancing();
});

app.Run();
```

> !warning Pipeline Placement
> Add the middleware to the **YARP pipeline only**, not the regular ASP.NET Core pipeline. The middleware requires access to YARP's HttpContext object.

---

### Configuration

#### Policy Modes

| Mode | Behavior |
|:-----|:---------|
| `BlockList` | Denies specified IPs, allows all others |
| `AllowList` | Allows only specified IPs, blocks all others |
| `Disabled` | Policy exists but remains inactive |

#### Global Policy

```json appsettings.json
{
  "IPFilterConfiguration": {
    "EnableGlobalPolicy": true,
    "GlobalPolicyName": "Global",
    "Policies": [
      {
        "PolicyName": "Global",
        "Mode": "BlockList",
        "IPAddresses": ["192.168.0.3", "192.168.0.4"]
      }
    ]
  }
}
```

#### Route-Specific Policy

Define additional policies and assign them via route metadata:

```json appsettings.json
{
  "IPFilterConfiguration": {
    "Policies": [
      {
        "PolicyName": "Intranet",
        "Mode": "AllowList",
        "IPNetworks": ["192.168.0.0/24", "10.0.0.0/8"]
      }
    ]
  },
  "ReverseProxy": {
    "Routes": {
      "admin-route": {
        "ClusterId": "admin-cluster",
        "Match": { "Path": "/admin/{**catch-all}" },
        "Metadata": { "IPFilterPolicy": "Intranet" }
      }
    }
  }
}
```

---

### Scenarios

#### &building& Corporate Intranet

Restrict admin panels to internal networks only:

```json
{
  "PolicyName": "InternalOnly",
  "Mode": "AllowList",
  "IPNetworks": ["10.0.0.0/8"]
}
```

#### &shield-off& Blocking Bad Actors

Block known malicious IPs globally:

```json
{
  "PolicyName": "Global",
  "Mode": "BlockList",
  "IPAddresses": [
    "203.0.113.50",
    "198.51.100.23"
  ]
}
```

---

### Testing

When unit testing, set `RemoteIpAddress` to a valid IP address on the HttpContext:

```csharp
httpContext.Connection.RemoteIpAddress = IPAddress.Parse("192.168.1.100");
```

---

### tl;dr

[x] Global IP filtering
[x] Route-specific policies
[x] CIDR notation support
[x] Dynamic configuration reload
[x] Activity tracing (v1.4.0)

---

### License

MIT License - see [LICENSE](https://github.com/bbelius/YARP.ReverseProxy.IPFilters/blob/main/LICENSE) for details.

# Ngrok Webhookify Plugin

This plugin lets you open ngrok tunnels on your computer with webhooks.

## Installation

Install the plugin globally by running

    npm i -g whfp-ngrok

## Configuration

The plugin needs a pre-defined list of tunnel configurations, which are passed to the ngrok connect function as-is.
Valid configuration keys are documented [here](https://www.npmjs.com/package/ngrok).

Example:
```json
{
    "tunnels": {
        "tunnel1": {
            ...
        },
        "ssh": {
            ...
        },
        "minecraft": {
            ...
        }
    }
}
```

## Controlling tunnels

Tunnels can be opened or closed by sending an object like this:
```json
{ "action": "open|close", "tunnel": "tunnel name" }
```

If the tunnel is open or closed already, the request is simply ignored.

## Getting tunnel addresses

If you perform a GET request on the endpoint you get an object which contains the status of all configured tunnels:
```json
{
    "tunnels": {
        "tunnel1": "closed",
        "ssh": "tcp://0.tcp.ngrok.io:11111",
        ...
    }
}
```
const packageJson = require("./package.json");
const { Plugin } = require('webhookify-plugin');
const ngrok = require('ngrok');
const mergeOptions = require('merge-options');

/**
 * config:
 * {
 *    global: {
 *      <config options which apply to all tunnels>
 *    },
 *    tunnels: {
 *      tunnel_name: {
 *        <config options for call to ngrok.connect()>
 *      }
 *   }
 * }
 */

const log = console.log.bind(null, "[ngrok]");

class NgrokPlugin extends Plugin {
	constructor(config) {
        super("ngrok", config);
        
        log("This is ngrok version " + packageJson.version);

        this._tunnels = {};
        this._globalConfig = this.config.global || {};
	}

    // payload: { action: <open|close>, tunnel: <tunnelname> }
    handlePush(payload) {
        if (!payload.action || !payload.tunnel) return;

        let tunnel = payload.tunnel;

        switch (payload.action) {
            case "open": {
                if (!(tunnel in this.config.tunnels)) {
                    return;
                }
        
                let tunnelConfig = mergeOptions(this._globalConfig, this.config.tunnels[tunnel]);

                if (this._tunnels[tunnel] != null) {
                    return; // tunnel is already open
                } else {
                    this._tunnels[tunnel] = ""; // so that we can issue another connect request
                    return ngrok.connect(tunnelConfig).then(url => {
                        this._tunnels[tunnel] = url;
                    }).catch(err => log("Error:", err));
                }
                break;
            }
            case "close": {
                if (tunnel == "all") {
                    return ngrok.disconnect().then(() => {
                        this._tunnels = {};
                        return ngrok.kill();
                    }).catch(err => log("Error:", err.message));
                } else if (tunnel in this._tunnels) {
                    return ngrok.disconnect(this._tunnels[tunnel]).then(() => {
                        delete this._tunnels[tunnel];

                        if (Object.keys(this._tunnels).length == 0) { // kill ngrok if we just closed the last open tunnel
                            return ngrok.kill();
                        }
                    }).catch(err => log("Error:", err));
                }
                break;
            }
        }
    }

	handleFetch(payload, reply) {
        let tunnels = Object.assign({}, this.config.tunnels);

        for(let tunnel in tunnels) {
            if (this._tunnels[tunnel] != null) {
                tunnels[tunnel] = this._tunnels[tunnel];
            } else {
                tunnels[tunnel] = "closed";
            }
        }

        return reply({ tunnels });
	}
}

module.exports = NgrokPlugin;
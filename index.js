const { Plugin } = require('webhookify-plugin');
const ngrok = require('ngrok');

/**
 * config:
 * {
 *    tunnels: {
 *      tunnel_name: {
 *        <config options for call to ngrok.connect()>
 *      }
 *   }
 * }
 */

class NgrokPlugin extends Plugin {
	constructor(config) {
        super("ngrok", config);
        
        this._tunnels = {};
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
        
                let tunnelConfig = this.config.tunnels[tunnel];

                if (this._tunnels[tunnel] != null) {
                    return; // tunnel is already open
                } else {
                    this._tunnels[tunnel] = ""; // so that we can issue another connect request
                    return ngrok.connect(tunnelConfig).then(url => {
                        this._tunnels[tunnel] = url;
                    }).catch(err => console.log("[ngrok]", "Error:", err.message));
                }
                break;
            }
            case "close": {
                if (tunnel == "all") {
                    return ngrok.disconnect().then(() => {
                        this._tunnels = {};
                    }).catch(err => console.log("[ngrok]", "Error:", err.message));
                } else if (tunnel in this._tunnels) {
                    return ngrok.disconnect(this._tunnels[tunnel]).then(() => {
                        delete this._tunnels[tunnel];
                    }).catch(err => console.log("[ngrok]", "Error:", err.message));
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
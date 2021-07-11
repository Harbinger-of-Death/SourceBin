let BinManager = require("..//Structures/BinManager").default
let fetch = require("node-fetch")
let cheerio = require("cheerio")
let Info = require("../Structures/Info.js")
class Base {
    /**
     * @param {string} accessToken - Your access token
     */
    constructor(accessToken) {
        /**
         * @private
         */
        this.constructor.ACCESS = accessToken ?? null
    }
    /**
     * The bins manager
     */
    get bins() {
        return new BinManager(this.constructor.ACCESS)
    }
    /**
     * Your info. You need to specify an access token
     * @return {Promise<Info>}
     */
    me() {
        return new Promise((resolve, rej) => {
            fetch(`https://sourceb.in/account`, {
                method: "GET",
                headers: {
                    "cookie": `access_token=${this.constructor.ACCESS}`
                }
            }).then(res => {
                if(res.status !== 200) return rej(`Error. Status: ${res.status} (${res.statusText})`)
                res.text().then(data => {
                    let $ = cheerio.load(data)
                    let username = $(".info > .username").text()?.replace(/[\n\r]+/gim, "")
                    let createdAt = $(".stats").find("div").first().text()?.trim()
                    let fileCount = $(".stats").find("div").text()?.split(/[\n\r]+/gim).filter(item => item)
                    resolve(new Info({
                        username: username,
                        createdAt: createdAt,
                        fileCount: fileCount?.[1] ?? 0
                    }))
                })
            })
        })
    }
}

module.exports = Base
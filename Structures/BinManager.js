let fetch = require("node-fetch")
let cheerio = require("cheerio")
let Code = require("./Code.js")
let collection = new (require("../@Collections/Collection/childrenCache").RaidenCol)
let fs = require("fs")
class BinManager {
    constructor(access) {
        /**
         * @private
         */
        this.constructor.ACCESS = access
    }
    fetch(id) {
        if(!id) return Promise.reject("Please specify an ID")
        let key = /(http(s)?:\/\/)?(www\.)?(sourceb|srcb)\.in\/.+/gim.exec(id) ? id.replace(/(http(s)?:\/\/)?(www\.)?(sourceb|srcb)\.in\//gim, "") : id
        return new Promise((resolve, rej) => {
            fetch(`https://sourceb.in/${key}`, {
                method: "GET"
            }).then(res => {
                if(res.status !== 200) return rej(`Error. Status: ${res.status} (${res.statusText})`)
                res.text().then(async data => {
                    let $ = cheerio.load(data)
                    let result = []
                    $(".stats").each(function() {
                        let today = $(this).find("p").first().text()
                        let view = /\d+\s((v|V)iew(s)?)/gim.exec($(this).find("p").text())?.[0]
                        result.push({
                            today: today,
                            view: view
                        })
                    })
                    let title = $(".title > .inline-editable").find("h1").text()
                    let description = $(".description > .inline-editable").find("p").text()
                    let highlight = $(".info > .language").text().trim()
                    let filename = $(".toolbar > .info").text().trim().split(/ +/gim)
                    let code = await fetch(`https://cdn.sourceb.in/bins/${key}/0`, { method: "GET"})
                    if(code.status !== 200) return rej(`Code error.  Status: ${code.status} (${code.statusText})`)
                    let codeData = await code.text()
                    Object.assign(result[0], { 
                        title: title,
                        description: description,
                        highlight: highlight,
                        filename: filename?.[1]?.trim(),
                        code: codeData
                    })
                    for(let results of result) {
                        return resolve(new Code(results, key, {
                            accessToken: this.constructor.ACCESS,
                            refreshToken: this.constructor.REFRESH
                        }))
                    }
                })
            })
        })
    }

    me(options = { id: "", limit: 0}) {
        if(options?.id && options?.limit) return Promise.reject("Request overload")
        let key = /(http(s)?:\/\/)?(www\.)?(sourceb|srcb)\.in\/.+/gim.exec(options?.id) ? options?.id.replace(/(http(s)?:\/\/)?(www\.)?(sourceb|srcb)\.in\//gim, "") : options?.id
        return new Promise((resolve, rej) => [
            fetch(`https://sourceb.in/api/user/bins`, {
                method: "GET",
                headers: {
                    "cookie": `access_token=${this.constructor.ACCESS}`
                }
            }).then(res => {
                if(res.status !== 200) return Promise.reject(`Error. Status: ${res.status} (${res.statusText})`)
                res.json().then(async data => {
                    if(options?.limit) {
                        let slicer = data.slice(0, options?.limit)
                        for(let bins of slicer) {
                            collection.set(bins["key"], await this.fetch(bins["key"]))
                        }
                        return resolve(collection)
                    }
                    if(options?.id) {
                        let find = data.find(value => value.key === key)
                        if(!find) return Promise.reject(`Fetch error. Status: 404 Not Found`)
                        return this.fetch(find.key).then(code => {
                            resolve(code)
                        })
                    }
                    for(let bins of data) {
                        collection.set(bins["key"], await this.fetch(bins["key"]))
                    }
                    return resolve(collection)
                })
            })
        ])
    }

    create(code, options = { description: "", title: "", languageId: "", filename: ""}) {
        if(!code) return Promise.reject("Please specify a code")
        if(/^..?\//gim.test(code)) {
            if(fs.statSync(code).isDirectory()) return Promise.reject("Please specify a file not just a directory")
            if([".png", ".jpg", ".jpeg"].some(value => code.endsWith(value))) return Promise.reject("That's an image")
        }
        let languageChecker = undefined
        if(typeof options?.languageId === "string" && options?.languageId) {
            languageChecker = Object.keys(this.constructor.LANGUAGE).filter(value => value === options?.languageId)
            if(languageChecker?.length <= 0) return Promise.reject(`Invalid Language, or does not exist`)
        }
        if(typeof options?.languageId === "number" && options?.languageId) {
            let values = Object.values(this.constructor.LANGUAGE).filter(value => value === options?.languageId)
            if(values?.length <= 0) return Promise.reject("Invalid Language, or does not exist")
        }
        let description = options?.description ?? ""
        let title = options?.title ?? ""
        let language = options?.languageId ? (this.constructor.LANGUAGE[languageChecker?.[0]] ?? options?.languageId) : 372
        let file = /^..?\//gim.test(code) ? fs.readFileSync(code)?.toString() : code
        if(!file) return Promise.reject("No code specified")
        return new Promise((resolve, rej) => {
            fetch(`https://sourceb.in/api/bins`, {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    title: title,
                    description: description,
                    files: [{
                        name: !options?.filename ? "" : options.filename,
                        content: file,
                        languageId: language
                    }]
                })
            }).then(res => {
                if(res.status !== 200) return Promise.reject(`Code error.  Status: ${res.status} (${res.statusText})`)
                res.json().then(data => {
                    this.fetch(data.key).then(code => {
                        resolve(code)
                    })
                })
            })
        })
    }

    delete(id) {
        if(!id) return Promise.reject("Please specify a key")
        let key = /(http(s)?:\/\/)?(www\.)?(sourceb|srcb)\.in\/.+/gim.exec(id) ? id.replace(/(http(s)?:\/\/)?(www\.)?(sourceb|srcb)\.in\//gim, "") : id
        return new Promise((resolve, rej) => [
            fetch(`https://sourceb.in/api/bins/${key}`, {
                method: "DELETE",
                headers: {
                    "cookie": `access_token=${this.constructor.ACCESS}`
                }
            }).then(res => {
                if(res.status !== 200) return rej(`Error. Status: ${res.status} (${res.statusText})`)
                res.json().then(data => {
                    resolve(data.success)
                })
            })
        ])
    }
}

BinManager.LANGUAGE = {
    "1C Enterprise": 0,
    "4D": 577529595,
    ACTIONSCRIPT: 10,
    ASSEMBLY: 24,
    "C#": 42,
    "C++": 43,
    PYTHON: 303,
    JAVASCRIPT: 183,
    TEXT: 372,
    TYPESCRIPT: 378,
    GO: 132
}

exports["default"] = BinManager
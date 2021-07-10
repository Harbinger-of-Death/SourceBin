# SourceBin
 A SourceBin Wrapper

Examples

```js
import Base from "./SourceBin/Base.js"
let client = new Base(access, refresh); //access and refresh here is optional it's the only way to authorize as of yet

(async () => {
    let bin = await client.bins.fetch("<Key>") //Key here must be the bin key you get after the .in/key
    console.log(bin) //expected output: Info about the bin, such as url, createdAt, timestamp, it's key, title, description, how many views does it have, the language it is using and the code
    let myBin = await client.bins.me("<Key>") // Key here is the key of the bin that you have
    console.log(myBin) //expected an info about this bin. If no Key is specified a collection of all bins you have and their infos. To use this method you must specify an access token and refresh token in the Base constructor.
})
```
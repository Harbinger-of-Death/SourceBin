class Info {
    constructor(data) {
        /**
         * @private
         */
        this._username = data?.username ?? null
        this.createdAt = /((t|T)oday)/gim.exec(data?.createdAt)?.[0] ? new Date() : data?.createdAt ? new Date(data.createdAt) : null
        /**
         * @private
         */
        this._createdTimestamp = this.createdAt?.getTime() ?? null
        /**
         * @private
         */
        this._fileCount = +data?.fileCount
    }
    /**
     * Your username
     * @return {string}
     */
    get username() {
        return this._username
    }
    /**
     * Your Created timestamp
     * @return {number}
     */
    get createdTimestamp() {
        return this._createdTimestamp
    }
    /**
     * How many bins you have in your account
     * @return {number}
     */
    get fileCount() {
        return this._fileCount
    }
}

module.exports = Info
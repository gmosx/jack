require("../jack");

Jack.Response = function(body, status, headers, block) {
    var that = this;
    
    this.status = status || 200;
    this.headers = HashP.merge({"Content-Type" : "text/html"}, headers);
    
    this.writer = function(x) { that.body.push(x); };
    this.block = null;
    this.length = 0;
    this.body = [];
    
    if (body)
    {
        if (body.each)
        {
            body.each(function(part) {
                that.write(String(part));
            });
        }
        else if (body.toString)
            // FIXME: *all* objects response to toString...
            this.write(body.toString());
        else
            throw new Error("stringable or iterable required");
    }
        
    if (block)
        block(this);
}

Jack.Response.prototype.setHeader = function(key, value) {
    HashP.set(this.headers, key, value);
}
Jack.Response.prototype.getHeader = function(key) {
    return HashP.get(this.headers, key);
}

Jack.Response.prototype.write = function(str) {
    var s = String(str);
    this.length += s.length;
    this.writer(s);
    return str;
}

Jack.Response.prototype.finish = function(block) {
    this.block = block;
    
    if (this.status == 204 || this.status == 304)
    {
        HashP.unset(this.headers, "Content-Type");
        return [this.status, this.headers, []];
    }
    else
    {
        if (!HashP.includes(this.headers, "Content-Type"))
            HashP.set(this.headers, "Content-Type", this.length.toString(10));
        return [this.status, this.headers, this];
    }
}

Jack.Response.prototype.each = function(callback) {
    this.body.each(callback);
    this.writer = callback;
    if (this.block)
        this.block(this);
}

Jack.Response.prototype.close = function() {
    if (this.body.close)
        this.body.close();
}

Jack.Response.prototype.isEmpty = function() {
    return !this.block && this.body.length === 0;
}
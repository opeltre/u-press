// /surf/ajax.js :
//      : ajax().get(url).then((res) => ... )
//      : ajax().post(url,data).then((res) => ... );

const ajax = () => {
    return new Ajax();
}
class Ajax {
    
    constructor () {
        this.xhr = new XMLHttpRequest();
        this.data = null;
    }
    
    get (url) {
        this.xhr.open('GET',url);
        return this;
    }
    
    post (url, data) {
        this.xhr.open('POST', url);
        this.data = data;
        this.xhr.setRequestHeader('Content-Type','application/json');
        return this;
    }
    
    then (callback) {
        var f = callback || (() => null);
        this.xhr.onreadystatechange = () => {
            this.ok() && f(this.xhr.responseText);
        }
        this.xhr.send(this.data);
    }
    
    ok () {
        return this.xhr.readyState === 4 && this.xhr.status === 200;
    }

}

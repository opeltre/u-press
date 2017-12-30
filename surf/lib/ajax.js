// /surf/ajax.js :
//      : ajax().get(url).then((res) => ... )
//      : ajax().post(url,data).then((res) => ... );

const ajax = () => {
    return new Ajax();
}

class Ajax {
    
    constructor () {
        this.xhr = new XMLHttpRequest();
    }
    
    get (url) {
        this.xhr.open('GET',url);
        return this.promise();
    }
    
    post (url, data) {
        this.xhr.open('POST', url);
        return this.fill(data).promise();
    }

    del (url, data) {
        this.xhr.open('DELETE', url);
        return this.fill(data).promise();
    }

    put (url, data) {
        this.xhr.open('PUT', url);
        return this.fill(data).promise();
    }

    promise () {
        return new Promise(resolve => this.then(resolve));
    }
    
    fill (data) {
        this.data = data;
        this.xhr.setRequestHeader('Content-Type','application/json');
        return this;
    }

    then (f) {
        this.xhr.onreadystatechange = () => {
            this.ok() && f(this.xhr.responseText);
        }
        this.xhr.send(this.data);
    }
    
    ok () {
        return this.xhr.readyState === 4 && this.xhr.status === 200;
    }

}

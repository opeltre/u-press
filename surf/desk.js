// desk.js

class Page {
    
    constructor () {
        this.mode = 'r';
        this.text = null;
        this.get()
    }

    modeSwitch () {
        if (this.mode == 'r') {
            this.edit();
            this.mode = 'w';
            d3.select('#mode-btn').html('view');
        } else {
            this.view();
            this.mode = 'r';
            d3.select('#mode-btn').html('edit');
        }
    }
    
    read () { 
        if (this.mode == 'w') {
            this.text = d3.select('textarea').property('value');
        }
        return this;
    }

    edit () {           // enter edit mode
        d3.select('#page').html('')
            .append('textarea')
                .html(this.text);
        return this;
    }
    
    view () {           // preview edit 
        d3.select('#page').html(marked(this.read().text));
        MathJax.Hub.Queue(['Typeset',MathJax.Hub,'page']);
        return this;
    }
        
    post () {           // post edit
        var data = JSON.stringify([this.read().text])
        console.log(data);
        ajax().post(window.location,data).then((res) => window.location.reload());
    }

    get () {
        ajax().get(window.location+'/md').then((res) => this.text = res);
    }
    
}
        
var page = null;
document.addEventListener('DOMContentLoaded', () => page = new Page());

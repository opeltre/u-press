// ./surf/lib/page.js

const sleep = ms => new Promise(res => setTimeout(res, ms));

function Page () {

/* page: retrieves documents via ajax before parsing them to html
 * 
 * controls better be optional
 */

    var self = {
        route: '/',
        mode: 'r',
        text: 'yoooo',
        posted: true,
        parser: jam.parse
    }

    function my (selection) {
        my.selection = (selection || my.selection);
        return my.get()
            .then(my.view)
    }

    my.switch = () => {
        return my.mode() == 'r'
            ? my.edit().mode('w')
            : my.view().mode('r');
    }
    
    my.read = () => {
        return my.mode() == 'w' 
            ? my.text(my.selection.select('textarea').property('value'))
            : my;
    }

    my.edit = () => {
        my.selection.html('')
            .append('textarea')
                .html(my.text());
        return my.posted(false);
    }

    my.view = () => {
        my.selection
            .html(
                my.parser()(my.read().text())
            );
        return my.mathjax();
    }

    my.mathjax = () => {
        MathJax.Hub.Queue(["Typeset",MathJax.Hub, my.selection.property('id')]);
        return my;
    }

    my.post = () => {
        var data = JSON.stringify([my.read().text()]);
        return ajax()
            .post('/doc'+my.route(), data)
            .then(res => res == 'write'
                ? my.posted(true).view().mode('r')
                : alert(res)
            );
    }

    my.get = function (url) {
        url && my.route(url)
        return ajax()
            .get('/doc' + self.route)
            .then(res => my.text(res||''));
    }
    
    return getset(my,self);
}
                

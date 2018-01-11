// ./surf/lib/desk.js
//
// depends on nav.js for now
// (where getset lies...)

const sleep = ms => new Promise(res => setTimeout(res, ms));

function Page () {

/* page: retrieves documents via ajax before parsing them to html
 * 
 * controls better be optional
 */

    self = {
        mode: 'r',
        text: 'yoooo',
        route: '/',
        parser: jam.parse
    }

    function my (selection) {
        my.selection = selection
            .html(self.parser(this.text));
    }

    my.switch = () => {
        return self.mode() == 'r'
            ? my.mode('w').edit()
            : my.mode('r').view();
    }
    
    my.read = () => {
        return my.mode == 'w' 
            ? my.text(my.selection.select('textarea').html())
            : my;
    }

    my.edit = () => {
        my.selection.append('textarea')
            .html(my.text());
        return my;
    }

    my.view = () => {
        my.selection.html(self.parser(my.read().text()));
        return my;
    }

    my.post = () => {
        var data = JSON.stringify(my.read().text());
        return ajax()
            .post('/doc' + self.route, data)
            .then(res => {
                console.log(res);
                sleep(1000).then(window.location.reload)
            });
    }

    my.get = () => {
        return ajax()
            .get('/doc' + self.route);
    }
    
    return getset(my,self);

}
                

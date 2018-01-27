function Main () {

/* main: controller for nav & page components
 */
    var self = {
        route: '/',
    };
    
    var nav = false;

    function my () {
        my.route(my.url().replace('/read/','/'));
        // page
        my.page = Page()
            .route(self.route);
        my.page.ctl = Ctl()
            .buttons([
                ['r/w', my.page.switch],
                ['post', my.page.post]
            ]);
        d3.select('#page').call(my.page);
        d3.select('#page-ctl').call(my.page.ctl);
        // preview page
        my.view = Page()
            .route(self.route);
        d3.select('#view').call(my.view)
            .on('click', my.onview);
        // nav panel
        my.nav = Nav()
            .lvl(2)
            .route(my.parent())
            .focus(self.route)
            .bind(d => my.preview(d.url));
        d3.select('#nav').call(my.nav)
    }
   
    my.parent = (url) => (url || self.route).replace(/[^\/]+\/$/,'');
    
    my.url = (...args) => {
        if (!args.length) return window.location.pathname;
        else window.location = args[0];
    }
    
    my.switch = () => {
        hideNseek({
            inline: ['#nav', '#page-ctl'],
            block: ['#page', '#view']
        })();
        nav = !nav;
    }

    my.preview = (url) => {
        return Promise.all([
            my.view.route(url)(),
            my.nav.focus(url).route(my.parent(url))()
        ]);
    }

    my.onview = () => {
        my.page.posted() || confirm('no post it?')
            ? my.url('/read'+my.nav.focus())
            : my.switch();
    }

    return getset(my, self);
}

var u = Main();
document.addEventListener('DOMContentLoaded',u);

// getset.js
/********************************/
/****** helper functions ********/

function getset (obj, attrs) {
    
    Object.keys(attrs).forEach(
        key => obj[key] = function (val) {
            if (!arguments.length) return attrs[key];
            attrs[key] = val;
            return obj;
        }
    );
    return obj;
}

function hideNseek (displays) {

    return () => {
        Object.keys(displays)
            .forEach( k => {
                displays[k].forEach(q => {
                    s = d3.select(q);
                    s.style(
                        'display',
                        s.style('display') == 'none' ? k : 'none'
                    );
                    console.log(s.node());
                });
            });
    }
}


function style (selection, my, sheet) {
    
    var sheet = sheet || my.style();

    Object.keys(sheet).forEach(
        key => selection.style(
            key, 
            typeof sheet[key] == "function"
                ? sheet[key](my)
                : sheet[key]
        )
    );
}

function flush (selection) {
    selection.selectAll('*').remove();
}

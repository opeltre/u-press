// ./surf/lib/nav.js
function Nav () {

/* nav panel:
 *
 *  : var nav = Nav().lvl(2)
 *  : d3.select('#route')
 *  :   .call(nav);
 */
    
    var self = {
        show: false,
        route: '/',
        lvl: 2,
//        ctlr: surf
    };

    function my (selection) {
        my.selection = selection.call(flush);
        ajax().get('/route'+ self.route)
            .then(d => my.draw(JSON.parse(d)));
    }

    my.draw = (tree) => {
        // nav items: documents dirtree
        my.selection.selectAll(`.nav${self.lvl}`)
            .data([tree])
            .enter().append('div')
                .attr('class',`.nav${self.lvl}`)
                .call(NavItem(self.lvl).lvl(self.lvl));
        // nav controls: put, delete & co
        var btns = {
            ' + ': my.put,
            ' - ': my.del
        };
        my.selection
            .append('div').property('id', 'nav-ctl')
            .call(Ctl().buttons(btns));
    };

    my.put = () => {
        var data = {name: prompt('name it','')};
        return ajax()
            .put('/route'+self.route, JSON.stringify(data))
            .then(res => alert(res))
    };

    my.del = () => {
        if (self.route == '/') return alert("don't do it!");
        return ajax()
            .del('/route'+self.route)
            .then(res => alert('/route'+self.route+'\n'+JSON.stringify(res)));
    };
    
    return getset(my, self);
}

function NavItem (depth) {

/* nav item: spawned by Nav
 *
 *  : d3.select('#route').data(tree).call(NavItem(1).lvl(2))
 */  
    var self = {
        lvl: 0,
        expanded: depth ? true : false,
        style: {
            'font-family': 'bowman',
            'font-size': my => (14 + 4 * my.lvl()),
            'margin': 5,
            'margin-left': 30,
            'color': 'black'
        }
    };
    
    function my (selection) {
        my.selection = selection
            .call(style, my)
        my.selection.append('span')
            .html('+ ')
            .on('click', (d) => self.expanded ? my.retract() : my.expand())
        my.selection.append('span')
            .html(d => d.name)
            .on('click', d => alert(d.url));
        // expand it
        if (depth && self.lvl > 0) 
            my.expand(depth - 1);
    }

    my.expand = (depth) => {
        if (self.lvl === 0) return my;
        my.selection
            .selectAll(`.nav${self.lvl-1}`)
            .data(d => d.children)
            .enter().append('div')
                .attr('class',`nav${self.lvl-1}`)
                .each(function () {
                    d3.select(this).call(NavItem(depth || 0).lvl(self.lvl-1));
                });
        self.expanded = true;
        return my;
    };

    my.retract = () => {
        my.selection
            .selectAll(`.nav${self.lvl-1}`)
            .remove();
        self.expanded = false;
        return my;
    };

    return getset(my, self);

}

function Ctl () {
    
    self = { 
        buttons: {'btn': () => alert('uclick')} 
    } 

    function my (selection) {
        self.buttons = Object.keys(self.buttons)
            .map(k => ({html: k, onclick: self.buttons[k]}))
        selection
            .selectAll('button')
            .data(self.buttons)
            .enter().append('button')
                .html(d => d.html)
                .on('click', d => d.onclick())
    }
    
    return getset(my, self);

}

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

function style (selection, my) {
    
    var sheet = my.style();

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
    selection.selectAll('*').remove;
}


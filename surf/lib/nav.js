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
        focus: '/',
        lvl: 2,
        bind: () => alert('click')
//        ctlr: surf
    };

    function my (selection) {
        my.selection = (selection || my.selection);
        // nav-item click:
        return ajax()
            .get('/route'+ self.route)
            .then(d => my.draw(JSON.parse(d)));
    }

    my.draw = (tree) => {
        my.selection.call(flush);
        // nav items: documents dirtree
        my.item = NavItem(self.lvl)
            .lvl(self.lvl)
            .bind(self.bind)
            .focus(self.focus);
        // nav controls: put, delete & co
        my.ctl = Ctl().buttons([
            [' + ', my.put],
            [' - ', my.del]
        ]);
        my.selection.selectAll(`.nav${self.lvl}`)
            .data([tree])
            .enter().append('div')
                .attr('class',`.nav${self.lvl}`)
                .call(my.item);
        my.selection
            .append('div').property('id', 'nav-ctl')
            .call(my.ctl);
        return my;
    };

    my.put = () => {
        var data = {name: prompt('name it','')};
        return ajax()
            .put('/route'+self.focus, JSON.stringify(data))
            .then(res => alert(res))
            .then(my);
    };

    my.del = () => {
        if (self.focus == '/') return alert("don't do it!");
        return ajax()
            .del('/route'+self.focus)
            .then(res => alert(res))
            .then(my);
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
        bind: () => alert('uclick'),
        focus: '/',
        style: {
            'font-family': 'bowman',
            'font-size': my => (14 + 4 * my.lvl()),
            'margin': 5,
            'margin-left': 30,
            'color': 'black'
        },
        stylefocus: {
            'border': '2px solid #ddd5c4'
        }
    };
    
    function my (selection) {
        my.selection = selection
            .call(style, my)
            .classed('nav-focus', d => d.url == self.focus)
        my.selection.append('span')
            .html('+ ')
            .on('click', d => self.expanded ? my.retract() : my.expand())
        my.selection.append('span')
            .html(d => d.name)
            .attr('class','nav-item')
            .on('click', my.bind());
        // expand it
        if (depth && self.lvl > 0) 
            my.expand(depth - 1);
        return my;
    }

    my.item = (depth) => {
        return NavItem(depth || 0)
            .lvl(self.lvl-1)
            .bind(self.bind)
            .style(self.style)
            .focus(self.focus);
    }

    my.expand = (depth) => {
        if (self.lvl === 0) return my;
        my.selection
            .selectAll(`.nav${self.lvl-1}`)
            .data(d => d.children)
            .enter().append('div')
                .attr('class',`nav${self.lvl-1}`)
                .each(function () {
                    d3.select(this).call(my.item(depth));
                });
        return my.expanded(true);
    };

    my.retract = () => {
        my.selection
            .selectAll(`.nav${self.lvl-1}`)
            .remove();
        return my.expanded(false);
    };

    return getset(my, self);

}

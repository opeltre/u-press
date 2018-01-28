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
        moving: null,
        bind: () => alert('click')
    };

    function my (selection) {
        my.selection = (selection || my.selection);
        console.log(my.moving());
        return ajax()
            .get('/route'+ self.route)
            .then(d => my.draw(JSON.parse(d)));
    }

    my.draw = (tree) => {
        my.selection.call(flush);
        // nav-items: dirtree
        my.selection.selectAll(`.nav-item`)
            .data([tree])
            .enter().append('div')
                .attr('class',`nav-item lvl${self.lvl}`)
                .call(my.item(self.lvl));
        // ctl: put del mv
        my.selection
            .append('div').property('id', 'nav-input');
        my.selection
            .append('div').property('id', 'nav-ctl')
            .call(my.ctl);
        if (self.moving) 
            my.selection.select('#nav-input')
                .call(my.input);
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

    my.mv = (to, n) => {
        if (to.startsWith(self.moving)) return alert("don't do it!"); 
        console.log(self.moving, to, n);
        return ajax()
            .move('/route'+self.moving, JSON.stringify({to:to, n:n}))
            .then(() => my.moving(null).route(my.parentUrl(to))());
    }

    my.move = () => {
        if (self.focus == '/') return alert("don't do it!");
        !my.moving()
            ? my.moving(self.focus)()
            : my.moving(null)();
    }
   
    my.item = (depth) => {
        return NavItem(depth || 0)
            .lvl(self.lvl)
            .bind(self.bind)
            .focus(self.focus)
            .moving(self.moving)
            .nav(my);
    }

    my.slot = () => {
        return NavSlot()
            .bind((d,i) => my.mv(d.url + my.input.read(), d.i));
    }

    my.input = Input()
        .btn('mv')
        .init(i => i
            .val(my.nameUrl(self.moving))
            .submit(val => my.mv(my.parentUrl(self.moving)+ val + '/'))
        );

    my.ctl = Ctl()
        .buttons([
            [' + ', my.put],
            [' - ', my.del],
            [' &gt; ', my.move]
        ]);
    
    // url helpers: flatten tree & make them dispensable
    my.nameUrl = url => url.replace(/.*\/([^\/]+)\/?$/, '$1');
    my.parentUrl = url => url.replace(/[^\/]*\/?$/, '');
    
    return getset(my, self);

}


function NavItem (depth) {

/* nav item: spawned by Nav
 *
 *  : d3.select('#route').data(tree).call(NavItem(1).lvl(2))
 *
 * DRY: should include a reference to its Nav owner,
 *      else be defined as a Nav `extends, 
 */  
    var self = {
        lvl: 0,
        expanded: depth ? true : false,
        bind: () => alert('uclick'),
        focus: '/',
        moving: null,
        style: {
            'font-family': 'bowman',
            'font-size': my => (14 + 4 * my.lvl()),
            'margin': 5,
            'margin-left': 30,
            'color': 'black'
        },
        stylefocus: {
            'border': '2px solid #ddd5c4'
        },
        nav: null
    };
    
    function my (selection) {
        my.selection = selection
            .call(style, my)
            .classed('nav-focus', d => d.url == self.focus)
            .classed('nav-moving', d => d.url == self.moving)
        // expand click
        my.selection.append('span')
            .html('+ ')
            .on('click', d => self.expanded ? my.retract() : my.expand())
        // bind click: from above
        my.selection.append('span')
            .html(d => d.name)
            .on('click', my.bind());
        // expand it
        if (depth && self.lvl > 0) 
            my.expand(depth - 1);
        return my;
    }
    
    my.child = set => set
        ? `nav-item lvl${self.lvl - 1}`
        : `.nav-item.lvl${self.lvl - 1}`;

    my.item = (depth) => my.nav().item(depth)
        .lvl(self.lvl-1)
        .style(self.style);

    my.expand = (depth) => {
        if (self.lvl === 0) return my;
        my.selection
            .selectAll(my.child())
            .data(d => d.children)
            .enter().append('div')
                .attr('class', my.child(1))
                .each(function () {
                    d3.select(this).call(my.item(depth));
                });
        return my.expanded(true).moving()
            ? my.slots()
            : my;
    };

    my.retract = () => {
        my.selection
            .selectAll('.nav-slot,'+my.child())
            .remove();
        return my.expanded(false);
    };

    my.slots = () => {
        var children = my.selection
            .selectAll(my.child());
        var slots = children
            .data().concat(['last'])
            .map((d,i) => my.selection.datum().url);
        slots.forEach((d,i) => my.selection
            .insert('div', () => children._groups[0][i])
            .datum({url:d, i:i})
            .call(my.nav().slot())
        );
        return my;
    };

    return getset(my, self);
}

function NavSlot () {

    var self = {
        bind: d => alert('slot!'+ d)
    }
    
    function my (selection) {
        selection
            .attr('class', 'nav-slot')
            .on('click', my.bind())
    }

    return getset(my,self);
}

class Nav {

    constructor (raw) {

        this.raw = raw || false;
        this.doc = JSON.parse(d3.select('.data code').html());
        d3.select('.data').remove();
        console.log(this.doc);
        this.render();
    }

    render () {
        d3.select('#page').append('h2')
            .attr('class','doc')
            .html(Nav.docRdr(this.doc));
        d3.selectAll('#page').selectAll('.child').data(this.doc.children)
            .enter().append('h3')
                .attr('class','child')
                .html(d => Nav.docRdr(d));
    }

    static docRdr (doc) {
        return `<a href="/browse${doc.url}">${doc.name}</a>`;
    }

    add () {

        this.askName(n => this.put(n));
    }

    put (name) {
        
        return ajax()
            .put(window.location, JSON.stringify({name:name}))
            .then(res => { res == 'put'
                ? window.location = window.location
                : alert(res);
            });
    }

    del () {
        if (this.doc.url == "/") {
            return Promise.resolve().then(() => alert("don't do it"));
        }
        return ajax()
            .del(window.location)
            .then( res => {
                d3.select('#page')
                    .append('pre').append('code')
                    .html(res);
                setTimeout(() => window.location = "/browse"+this.doc.parent, 2000);
            })
    }

    rise () {
        window.location = '/browse' + (this.doc.parent || "/");
    }

    read () {
        window.location = '/read' + this.doc.url;
    }

    askName (submit) {

        var ctl = d3.select('footer')
            .insert('span','#surfing + *')
            .attr('id','askName');
        var input = ctl.insert('input');
        ctl.insert('button')
            .html('put')
            .on('click', () => submit(input.property('value')) )
    }

}

console.log(Nav.docRdr({name:"u-press",url:"u-press.it"}));

var nav = new Nav({});

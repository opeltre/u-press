class Surfer {

    constructor (docs) {

        this.docs = docs;
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
        return ajax()
            .del(window.location)
            .then( res => {
                console.log(res);
                d3.select('#page')
                    .append('pre').append('code')
                    .html(res);
            })
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

var surfer = new Surfer({});

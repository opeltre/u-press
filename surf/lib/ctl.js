// ./surf/lib/ctl.js

function Ctl () {
    
    var self = { 
        buttons: [
            ['btn', () => alert('uclick')] 
        ]
    } 

    function my (selection) {
        selection
            .selectAll('button')
            .data(self.buttons)
            .enter().append('button')
                .html(d => d[0])
                .on('click', d => d[1]())
    }
    
    return getset(my, self);

}

function Input() {

    var self = {
        submit: val => alert(val),
        tmp: true,
        val: '',
        btn: 'submit',
        init: () => {} 
    };

    function my (selection) {
        console.log('input');
        my.init()(my);
        my.selection = selection.append('span');
        my.selection.append('input')
            .property('value',self.val)
        my.selection.append('button')
            .html(self.btn)
            .on('click', my.onclick);
    }

    my.onclick = () => {
        my.submit()(my.read());
        if (self.tmp)
            my.selection.remove();
    }

    my.read = () => {
        return my.selection.select('input')
            .property('value');
    }

    return getset(my, self);
}

            


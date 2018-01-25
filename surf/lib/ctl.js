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

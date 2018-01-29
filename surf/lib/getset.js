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


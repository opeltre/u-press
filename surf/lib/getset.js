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

function hideNseek (displays, selection) {
    /* the function that hides and shows
     *
     *  :   hideNseek(
     *  :       {'inline': '.class', 'block': '#id'},
     *  :       selection || document
     *  :   )
     */

    return () => {
        var S = selection || d3.select(document);
        Object.keys(displays)
            .forEach( k => {
                displays[k].forEach(q => {
                    s = S.select(q);
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


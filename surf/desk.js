function main() {
    read('Salut les moines!');
}

function read(text) {
    d3.select('#page')
        .html(text);
}

function edit() {
    let page = d3.select('#page');
    let text = page.html();
    page.html('');
    page.append('textarea')
        .html(text);
}

function post() {
    let page = d3.select('#page'); 
    let text = page.select('textarea').property('value');
    console.log(text);
    page.selectAll('textarea').exit();
    read(text);
}

// document.addEventListener('DOMContentLoaded',main);

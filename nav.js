// ./nav.js

const tree = (d3s, docs) => {
    
    d3s.selectAll('.doc')
        .data(docs)
        .enter().append('div')
            .attr('class','doc')
            .html((d) => Doc.repr(d))
            .selectAll('.section')
            .data((d) => d.sections)
            .enter().append('div')
                .attr('class','section')
                .html((d) => Section.repr(d));
}
            
const Doc = {
    repr : (d) => `<h2><a href="${d.url}">${d.name}</a></h2>`
};
const Section = {
    repr : (d) => `<a href="${d.url}">${d.name}</a>`
};

module.exports = tree;

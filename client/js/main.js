(function() {

    const getData = done => {

        const resources = [
            'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json',
            'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json'
        ]

        const init = {
            method: 'GET',
        };

        fetch(resources[0], init)
            .then(responseOne => responseOne.json())
            .then(responseOne => {
                fetch(resources[1], init)
                    .then(responseTwo => responseTwo.json())
                    .then(responseTwo => done([responseOne, responseTwo]))
                    .catch(err => console.log(err));
            }).catch(err => console.log(err));      

    }

    getData(dataArr => {

        console.log(dataArr);

        const fipsArr = dataArr[0].map(({ fips }) => fips);
        console.log(fipsArr);

        const countyIdArr = dataArr[1]['objects']['counties']['geometries'].map(({ id }) => id).sort((a, b) => a - b);
        console.log(countyIdArr);


        const topology = dataArr[1];


        const nationGeoJson = topojson.feature(topology, topology['objects']['nation']);
        const stateGeoJson = topojson.feature(topology, topology['objects']['states']);
        const countyGeoJson = topojson.feature(topology, topology['objects']['counties']);
        console.log(countyGeoJson);
        console.log(nationGeoJson);


        const w = 1200;
        const h = 600;

        // Define map projection
        // const projection = d3.geoAlbersUsa()
            // .translate([w / 2, h / 2]).scale([500]);

        // Define default path generator
        const path = d3.geoPath()
            // .projection(projection);

        const svg = d3.select('#svg-choropleth-map')
            .attr('width', w)
            .attr('height', h)


        const colorScale = d3.scaleQuantile()
            .range(["rgb(237, 248, 233)", "rgb(186, 228, 179)", "rgb(116,196,118)", "rgb(49,163,84)", "rgb(0,109,44)"]);

            svg.selectAll('path')
                .data(nationGeoJson.features)
                .enter()
                .append('path')
                .attr('d', d => {
                    console.log(d)
                    return path(d);
                })


    });

})();
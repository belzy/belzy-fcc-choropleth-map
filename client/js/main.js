(function() {

    const getData = done => {

        const cacheName = 'belzy-fcc-choropleth-data-cache';
        const cacheExpiry = 1800000; // 30 minutes in milliseconds
        const currentTime = new Date().getTime();
        let cache = JSON.parse(localStorage.getItem(cacheName));
        const resources = [
            'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json',
            'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json'
        ]
        const init = {
            method: 'GET',
        };

        // If data is not cached or is expired, request and cache new data.
        if (cache === null || cache['expiration'] <= currentTime) {

            if (cache === null) console.log('Cache doesn\'t exist. Creating new cache...');
            else if (cache['expiration'] <= currentTime) console.log('Cache has expired. Updating cache...');

            fetch(resources[0], init)
            .then(responseOne => responseOne.json())
            .then(responseOne => {
                fetch(resources[1], init)
                    .then(responseTwo => responseTwo.json())
                    .then(responseTwo => {

                        cache = {
                            expiration: currentTime + cacheExpiry,
                            data: [responseOne, responseTwo]
                        };

                        localStorage.setItem(cacheName, JSON.stringify(cache));

                        done([responseOne, responseTwo])
                    })
                    .catch(err => console.log(err));
            }).catch(err => console.log(err));      

        } else {

            console.log('Using cached data...');
            done([cache['data'][0], cache['data'][1]]);

        }

    }

    getData(dataArr => {

        const countyEduData = dataArr[0];
        const topology = dataArr[1];
        
        const nationGeoJson = topojson.feature(topology, topology['objects']['nation']);
        const stateGeoJson = topojson.feature(topology, topology['objects']['states']);
        const countyGeoJson = topojson.feature(topology, topology['objects']['counties']);
        
        // Sort counties by ascending id.
        countyGeoJson['features'].sort((a, b) => {
            
            if (a.id <= b.id) return -1;
            else if (b.id < a.id) return 0;
            
        });
        
        // Add each county's education data to counties properties object
        countyGeoJson.features.forEach((obj, i) => {
            countyGeoJson.features[i].properties = { ...countyEduData[i] }
        });

        // Get min/max percentages.
        const minPercent = d3.min(countyEduData, ({bachelorsOrHigher}) => bachelorsOrHigher);
        const maxPercent = d3.max(countyEduData, ({bachelorsOrHigher}) => bachelorsOrHigher);

        const w = 1200;
        const h = 740;
        const translateX = 125;
        const translateY = 100;

        // Color Scale
        colorsArr = [/*'#F7FBFF', '#DEEBF7',*/'#C6DBEF', '#9ECAE1', '#6BAED6', '#4292C6', '#2171B5', '#08519C', '#08306B'];
        const scaleColor = d3.scaleQuantize();
        scaleColor.domain([minPercent, maxPercent]).range(colorsArr);

         // Legend
         const legendWidth = 300;
         const legendHeight = 100 / colorsArr.length;
 
         const legendThreshhold = d3.scaleThreshold()
             .domain(((min, max, count) => {
 
                 const arr = [];
                 const step = (max-min) / count;
                 const base = min;
 
                 for (let i = 1; i < count; i++) {
                     arr.push(base + i * step);
                 }
 
                 return arr;
 
             })(minPercent, maxPercent, colorsArr.length))
             .range(colorsArr);
 
         const legendScaleX = d3.scaleLinear()
             .domain([minPercent, maxPercent])
             .range([0, legendWidth])
 
         const xLegendAxis = d3.axisBottom(legendScaleX)
             .tickSize(10, 0)
             .tickValues(legendThreshhold.domain())
             .tickFormat(d => `${d.toFixed(0)}%`);

        // Define default path generator
        const path = d3.geoPath()

        const svg = d3.select('#svg-choropleth-map')
            .attr('width', w)
            .attr('height', h)

        // Render Legend
        const legend = svg.append('g')
            .attr('id', 'legend')
            .attr('transform', `translate(${w - legendWidth - 260}, ${60})`)

        legend.append('g')
            .selectAll('rect')
            .data(legendThreshhold.range().map(color => {
                const d = legendThreshhold.invertExtent(color);
                if (d[0] == null) d[0] = legendScaleX.domain()[0];
                if (d[1] == null) d[1] = legendScaleX.domain()[1];
                return d;
            }))
            .enter().append('rect')
            .style('fill', (d, i) => legendThreshhold(d[0]))
            .attr('x', d => legendScaleX(d[0]))
            .attr('y', 0)
            .attr('width', d => legendScaleX(d[1]) - legendScaleX(d[0]))
            .attr('height', legendHeight)

        legend.append('g')
            .attr('transform', `translate(0, ${legendHeight})`)
            .call(xLegendAxis);
        
        const g = svg.append('g')
            .attr('transform', `translate(${translateX}, ${translateY})`)
            

            // svg.selectAll('path')
            //     .data(nationGeoJson.features)
            //     .enter()
            //     .append('path')
            //     .attr('d', d => {
            //         console.log(d)
            //         return path(d);
            //     })

            g.selectAll('.county')
                .data(countyGeoJson.features)
                .enter()
                .append('path')
                .attr('class', 'county')
                .attr('fill', (d, i) => scaleColor(d['properties']['bachelorsOrHigher']))
                .attr('d', path)
                .attr('data-area-number', (d, i) => i)
                .attr('data-fips', (d, i) => d['properties']['fips'])
                .attr('data-education', (d, i) => d['properties']['bachelorsOrHigher'])
                .on('mouseenter', (d, i) => {
                    console.log('test')
                    const properties = d['properties'];
                    const tooltipData = `${properties['area_name']}, ${properties['state']}: ${properties['bachelorsOrHigher']}%`;

                    // rect.top, rect.right, rect.bottom, rect.left
                    const cellRect = document.querySelector(`[data-area-number="${i}"]`).getBoundingClientRect();

                    const topOffset = -15;
                    const leftOffset = 10;

                    d3.select('#tooltip')
                        .attr('data-education', () => countyGeoJson.features[i]['properties']['bachelorsOrHigher'])
                        .style('top', `${cellRect.top + ((cellRect.bottom - cellRect.top) / 2) + topOffset}px`)
                        .style('left', `${cellRect.right + leftOffset}px`)
                        .style('opacity', '0.7')

                    d3.select('#tooltip-data')
                        .text(tooltipData)
                })
                .on('mouseout', (d, i) => {
                    d3.select('#tooltip')
                        .style('opacity', '0.0')
                })

            g.selectAll('.state')
                .data(stateGeoJson.features)
                .enter()
                .append('path')
                .attr('class', 'state')
                .attr('fill', 'none')
                .attr('stroke', 'white')
                .attr('d', path)


    });

})();
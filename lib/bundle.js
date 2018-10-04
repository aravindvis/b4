'use strict';
const rp  = require('request-promise');

module.exports = (app, es) => {
    const url = `http://${es.host}:${es.port}/${es.bundles_index}/bundle`;

    app.post('/api/bundle', (req, res) =>{
        console.log('In the post for bundle');
        const bundle = { 
                          name: req.query.name||'',
                          books: [],
                       };
        rp.post({url, body:bundle, json:true})
                                 .then(esResBody =>{
                                             console.log(esResBody);
                                             res.status(201).json(esResBody);
                                  })
                                 .catch(({error}) =>{
                                             console.log('This is the catch'); 
                                             console.log(error);
                                             res.status(error.status || 502).json(error);
                                  });
    });

    app.get('/api/bundle/:id', async (req, res)=>{
        console.log('In the query for the bundle');
        console.log(req.params.id);
        const options = {
            url: `${url}/${req.params.id}`,
            json: true,
        };

        try{
           const esResBody = await rp(options);
           res.status(200).json(esResBody);
        }catch(esResErr){
            res.status(esResErr.statusCode || 502).json(esResErr.error);
        }
    });

}

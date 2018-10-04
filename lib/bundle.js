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
 
    app.put('/api/bundle/:id/name/:name', async(req, res) => {
        const bundleUrl = `${url}/${req.params.id}`;
        try{
           const bundle = (await rp({url:bundleUrl, json:true}))._source;
           console.log('Received bundle---->'+bundle);
           bundle.name = req.params.name;
	   console.log('Modified bundle---->'+bundle);
           const esResBody =  await rp.put({url:bundleUrl, body:bundle, json:true});
           res.status(200).json(esResBody);
        }catch(esResErr){
           res.status(esResErr.statusCode||502).json(esResErr.error);
        }
    });

    app.put('/api/bundle/:id/book/:pgid', async(req, res)=>{
         const bundleUrl = `${url}/${req.params.id}`;
         const bookUrl =  `http://${es.host}:${es.port}/${es.books_index}/book/${req.params.pgid}`;
         
         try{
             const[bundleRes, bookRes] = await Promise.all([
                   rp({url:bundleUrl, json:true}),
                   rp({url:bookUrl, json:true}),
             ]);
             const {_source:bundle, _version:version} = bundleRes;
             const {_source:book} = bookRes;
     
             const idx = bundle.books.findIndex(book => book.id === req.params.pgid);
             if(idx === -1) {
                bundle.books.push({
                    id: req.params.pgid,
                    title: book.title,
                });
             }  

             const esResBody = await rp.put({
                 url: bundleUrl,
                 qs: {version},
                 body: bundle,
                 json: true,
             });
             res.status(200).json(esResBody);
         }catch(esResErr){
              res.status(esResErr.statusCode||502).json(esResErr.error);
         }
    });
  
}

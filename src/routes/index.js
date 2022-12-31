const { Router } = require('express');
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const axios = require('axios');
const { Recipe, Diets } = require('../db');
const { API_KEY, spoonecularURL } = process.env;

const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);



const BuscApi = async () => {
    try {
        //const infoApi = await axios.get(`${spoonecularURL}`);
        const BuscarenApi = await axios.get(`https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&addRecipeInformation=true&number=100`);
        //console.log(infoApi);
        let info = await BuscarenApi.data.results?.map((el) => {
            return {
                id: el.id,
                name: el.title,
                summary: el.summary,
                healthScore: el.healthScore,
                image: el.image,
                dishTypes: el.dishTypes?.map(el => el),
                diets: el.diets?.map(elem => elem),
                steps: el.analyzedInstructions[0]?.steps.map((el) => `${el.number} ${el.step}`).join(' '),
                
            }
        })
        return info;
    }
    catch (err) {
        return err;
    }
};

const buscarenDb = async () => {
    try{
        const buscardb = await Recipe.findAll({
            include: {
                medel: Diets,
                atributes: ['name'],
                through: {
                    atributes: [],
                }
            }
        })

        let infodb = await buscardb?.map((el) => {
            return {
                id: el.id,
                name: el.name,
                summary: el.summary,
                healthScore: el.healthScore,
                image: el.image,
                steps: el.steps,
                diets: el.diets?.map(elem => elem.name),
            }
        })
        return infodb;
    }
    catch (err) {
        return err;
    }
};

const dbyApi = async () => {
    try {
        const api = await BuscApi();
        const db = await buscarenDb();
        const dbapi = api.concat(db);
        return dbapi;
    }
    catch (err) {
        return err;
    }
};


const rece = async (receta) => {
    try {
        if(receta) {
            const buscareceta = await dbyApi();
            const resultado = buscareceta.filter((el) => el.name.toLowerCase().includes(receta.toLowerCase()) === true);
            if(resultado.length) return resultado;
        }else {
            const todas = await dbyApi();
            return todas;
        }
        throw ('No tenemos informacion sobre la receta');
    }
    catch (error) {
        return error;
    }
};

const idRece = async (idReceta) => {
    try {
        const buscareceta = await dbyApi();
        const receta = buscareceta.find((el) => el.id == idReceta)
        if(receta) {
            return receta;
        }
        else throw ('Lo sentimos, no tenemos receta con ese id')
    }
    catch (err) {
        return err;
    }
};


const putDietInfo = async () => {
    const dietTypes = [
        "gluten free", //
        "ketogenic", //
        "lacto ovo vegetarian", //
        "vegan", //
        "pescatarian", //
        "paleolithic", //
        "primal",//
        "fodmap friendly", //
        "whole 30", //
        "dairy free", //
    ];
    dietTypes.forEach((d) => {
        Diets.findOrCreate({
            where: {
                name: d,
            }
        })
    })
    return Diets.findAll();
};

// const postRecipe = async (objRecipe) => {
//     try {
//         const { name, summary, healthScore, steps, image, dishTypes, diets } = objRecipe;
//     const recipe = {
//         name,
//         summary,
//         healthScore,
//         steps,
//         image,
//         dishTypes
//     }
//     const dietInfo = await Diets.findAll({
//         where: {
//             name: diets,
//         }
//     })
//     const createRecipe = await Recipe.create(recipe);
//     createRecipe.addDiets(dietInfo);
//     return Recipe.findAll();
// }
// catch (err) {
//     console.log(err);
// }
// };


//creo las rutas

router.get('/', async (req, res) => {
    const name = req.query.name;
    try {
        if(name) {
            const devolver = await rece(name);
            res.status(200).json(devolver);
        }else {
            const todas = await rece();
            res.status(200).json(todas);
        }
    }
    catch (err) {
        res.status(400).send(err);
    }
});


// router.post('/', async (req, res) => {
//     //const name = req.body.name;
//     try {
//         const {objRecipe} = req.body;
//         if (!objRecipe)
//         res.status(404)
//         //.send('Falta Informacion')
//         const newRecipe = await postRecipe(objRecipe)
//         res.status(201).send(newRecipe)
//     }
//     catch (err) {
//         res.status(404).send(err);
//     }
// });


router.get('/:idReceta', async (req, res) => {
    const {idReceta} = req.params;
    try {
        const IdRec = await idRece(idReceta);
        res.status(200).json(IdRec);
    }
    catch (err) {
        res.status(400).send(err);
    }
});


router.get('/', async (req, res) => {
    try{
        const allDiets = await putDietInfo();
        res.status(200).send(allDiets);
    }
    catch (err) {
        res.status(404).send(err);
    }
});

router.post('/', async (req, res) => {
    let {
        name, summary, healthScore, steps, image, dishTypes, diets
    } = req.body;

    try {
        let recipeCreate = await Recipe.create({
            name,
            summary,
            healthScore,
            steps,
            image,
            dishTypes,
        })
        let dietDb = await Diets.findAll({
            where: {
                name: diets,
            }
        })
        if(!name) return res.status(400).send({error: 'Debe ingresar el name de la receta'});
        if(!summary) return res.status(400).send({error: 'Debe ingresar el summary de la receta'});
        console.log(recipeCreate);
        console.log(dietDb);

        recipeCreate.addDiets(dietDb);
        res.send('Succesfull');
    }
    catch (error) {
        res.status(400).send(error);
    }
})

module.exports = router;

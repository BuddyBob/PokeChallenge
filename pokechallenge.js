const axios = require('axios')
const fs = require('fs')
var _ = require('underscore')

// using /api/v2/pokemon/
function pokemon(){
    let poke_data = {}
    let db_data
    function getMoves(name, id){
        // get pokemon moves from pokeapi
        axios.get('https://pokeapi.co/api/v2/pokemon/'.concat(name)).then(function(r){
            let move_lst = []
            for (let i = 0; i < r.data.moves.length; i++){
                move_lst.push(r.data.moves[i].move.name)
            }
            // add pokemon moves to poke_data {pokemon: [moves]}
            poke_data[name] = move_lst
        })
    
    }
    
    async function compare(){
        // get dataset pokemons (name and moves)
        db_data = JSON.parse(fs.readFileSync('pokes.json', 'utf8'));
        for (let i = 0; i < db_data.length; i++){ getMoves(db_data[i].name) }
        // wait for poke_data to be populated
        await new Promise(resolve => setTimeout(resolve, 2500));
    
        // compare db_data (moves) to poke_data (moves) 
        for (let i = 0; i < db_data.length; i++){
            let db_name = db_data[i].name
            let db_moves = db_data[i].moves
            let poke_moves = poke_data[db_name]
            let pass = 0
            let fail = 0

            console.log("Pokemon: " + db_name + " id: " + (i+1))
            for (let j = 0; j < db_moves.length; j++){
                // check if the dataset moves are in pokeapi moves
                if (poke_moves.includes(db_moves[j])){
                    console.log("       Pass: "+ db_moves[j])
                    pass++
                }
                else{
                    console.log("       Fail: "+ db_moves[j])
                    fail++
                }
            }
            console.log()
            console.log(" Summary | total:" + (pass+fail) + " | pass:" + pass + " | fail:" + fail)
            console.log()
    
        }
    }
    compare()
}

// using /api/v2/move/
async function move(){
    let move_dict = {}
    let db_data = JSON.parse(fs.readFileSync('pokes.json', 'utf8'));
    async function get_learned_by_pokemon(curr_move, move_dict, current_poke){
        response = await axios.get('https://pokeapi.co/api/v2/move/'.concat(curr_move))

        let learned_by_pokemons = []
        for (let k = 0; k < response.data.learned_by_pokemon.length; k++){
            learned_by_pokemons.push(response.data.learned_by_pokemon[k].name)
        }
        // pass
        if (learned_by_pokemons.includes(current_poke)){
            move_dict[current_poke].pass.push(curr_move)
        }
        // fail
        else{
            move_dict[current_poke].fail.push(curr_move)
        }
        return move_dict

    }
    async function getPokes(){
        // iterate through all pokemon
        for (let i = 0; i < db_data.length; i++){
            let current_poke = db_data[i].name
            let moves = db_data[i].moves
            move_dict[current_poke] = {pass: [], fail: []}
            // iterate through all moves of pokemon
            for (let j = 0; j < moves.length; j++){
                let curr_move = moves[j]
                //get data on current move
                move_dict = await get_learned_by_pokemon(curr_move, move_dict, current_poke)
            }
            console.log("Pokemon: " + current_poke)
        }
        // iterate through move_dict and print results

        // wait for move_dict to be populated
        for (let key in move_dict){
            const fails = move_dict[key].fail.length
            const passes = move_dict[key].pass.length
            console.log("Pokemon: " + key)
            for (let i = 0; i < passes; i++){
                console.log("       Pass: "+ move_dict[key].pass[i])
            }
            for (let i = 0; i < fails; i++){
                console.log("       Fail: "+ move_dict[key].fail[i])
            }

            console.log()
            console.log(" Summary | total:" + (passes+fails) + " | pass:" + passes + " | fail:" + fails)
            console.log()
        }
    }
    getPokes()

}

async function move2(){
    let move_dict = {}
    let db_data = JSON.parse(fs.readFileSync('pokes.json', 'utf8'));

    async function get_learned_by_pokemon(curr_move, lst_pokes, move_dict){
        response = await axios.get('https://pokeapi.co/api/v2/move/'.concat(curr_move))

        // get list of pokemon that learn current move
        let learned_by_pokemons = []
        for (let i = 0; i < response.data.learned_by_pokemon.length; i++){
            learned_by_pokemons.push(response.data.learned_by_pokemon[i].name)
        }

        // compare 
        for (let j = 0; j < lst_pokes.length; j++){
            if (learned_by_pokemons.includes(lst_pokes[j])){
                move_dict[lst_pokes[j]].pass.push(curr_move)
            }
            else{
                move_dict[lst_pokes[j]].fail.push(curr_move)
            }
        }
        return move_dict
    }


    async function format_data(db_data){
        let moves = {}
        // create dictionary of moves {move: [pokemon1, pokemon2, ...]}
        for (let i = 0; i < db_data.length; i++){
            let curr_poke = db_data[i].name
            move_dict[curr_poke] = {pass: [], fail: []}
            for (j = 0; j < db_data[i].moves.length; j++){
                let curr_move = db_data[i].moves[j]
                if (Object.keys(moves).includes(curr_move)){
                    moves[curr_move].push(curr_poke)
                }
                else{
                    moves[curr_move] = [curr_poke]
                }
            }
        }

        for (let i = 0; i < Object.keys(moves).length; i++){
            // console.log("Current Poke: " + Object.values(moves)[i])
            move_dict = await get_learned_by_pokemon(Object.keys(moves)[i], Object.values(moves)[i], move_dict)
        }


    }

    // get unique moves
    await format_data(db_data)

    // iterate through move_dict and print results
    for (let key in move_dict){
        const fails = move_dict[key].fail.length
        const passes = move_dict[key].pass.length
        console.log("Pokemon: " + key)
        for (let i = 0; i < passes; i++){
            console.log("       Pass: "+ move_dict[key].pass[i])
        }
        for (let i = 0; i < fails; i++){
            console.log("       Fail: "+ move_dict[key].fail[i])
        }

        console.log()
        console.log(" Summary | total:" + (passes+fails) + " | pass:" + passes + " | fail:" + fails)
        console.log()

    }

    // getPokes()

}

// /api/v2/move/

// pokes.json moves (500)
// move()

// pokes.json moves (390) - faster
move2()

//----------------------------------------------------------------------------------------------------------------------

// /api/v2/pokemon/

// pokemon()



//iterate through pokemons in pokes.json
//   get pokemon and moves from pokes.json
//   iterate through moves
//      call https://pokeapi.co/api/v2/move/(current_move)
//      get learned_by_pokemon and check if pokemon is in this list
//      if pokemon is in this list add this move to move_dict (move_dict[pokemon][pass].push(move))
//      else add this move to move_dict (move_dict[pokemon][fail].push(move))
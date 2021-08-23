const request = require('request');

module.exports = (MAIN, pokemon) => {
  if(!pokemon){ return undefined; }
  pokemon = pokemon.split(' ');

  // DEFINE VARIABLES
  let pokemon_form = '';
  let pokemon_id = '', form_id = '';
  let pokemon_name = pokemon[0].toString().toLowerCase();

  if(pokemon_name == 'mega') { pokemon_name += ' '+pokemon[1].toString().toLowerCase(); }
  if(pokemon[2] && (pokemon[2].toString().toLowerCase() == 'x' || pokemon[2].toString().toLowerCase() =='y')) { pokemon_name += ' '+pokemon[2].toString().toLowerCase(); }
	else { pokemon_name = pokemon_name; }
  
  if(pokemon[1] && (pokemon[1].toString().toLowerCase() != 'charizard' || pokemon[1].toString().toLowerCase() != 'blastoise' || pokemon[1].toString().toLowerCase() != 'venusaur' || pokemon[1].toString().toLowerCase() != 'beedrill' || pokemon[1].toString().toLowerCase() != 'pidgeot')) { pokemon_form = pokemon[1].toString().toLowerCase(); }
  if(pokemon[2] && (pokemon[2].toString().toLowerCase() != 'x' || pokemon[2].toString().toLowerCase() != 'y')) { pokemon_form += ' '+pokemon[2].toString().toLowerCase(); }
  // EN NAMES LOOKUP
  for (key in MAIN.masterfile.pokemon) {
    if (MAIN.masterfile.pokemon[key].name.toLowerCase() === pokemon_name) {
      pokemon_id = key;
      if (pokemon_form && MAIN.masterfile.pokemon[key]){
        Object.keys(MAIN.masterfile.pokemon[key].forms).forEach(function(id){
          if(!MAIN.masterfile.pokemon[key].forms[id].name){
            console.error('[masterfile.json] Missing missing name info for Pokemon id: '+key+' Form: '+id);
            return undefined;
        }
          if(MAIN.masterfile.pokemon[key].forms[id].name.toLowerCase() === pokemon_form){
            form_id = id;
          }
        });
      }
      // else if(MAIN.masterfile.pokemon[key].default_form){
      //   form_id = MAIN.masterfile.pokemon[key].default_form;
      // }
      else { form_id = 0; }
      return {pokemon_id: pokemon_id, form: form_id, pokemon_name: MAIN.masterfile.pokemon[key].name};
    }
  }

  // DE NAMES LOOKUP
  for (key in MAIN.de.values) {
    let index = key.split('_')[0];
    if (index.indexOf('poke') >= 0 && MAIN.de.values[key].toLowerCase() === pokemon_name) {
      pokemon_id = key.split('_')[1];
      if (pokemon_form && MAIN.masterfile.pokemon[key]){
        Object.keys(MAIN.masterfile.pokemon[key].forms).forEach(function(id){
          if(MAIN.de.values['form_'+id].toLowerCase() === pokemon_form){
            form_id = id;
          }
        });
      }
      // else if(MAIN.masterfile.pokemon[pokemon_id].default_form){
      //   form_id = MAIN.masterfile.pokemon[pokemon_id].default_form;
      // }
      else { form_id = 0; }
      return {pokemon_id: pokemon_id, form: form_id, pokemon_name: MAIN.de.values[key]};
    }
  }
}

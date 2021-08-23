// Get Size of Pokemon BIG Karp/Tiny Rat
module.exports = (MAIN, pokemon_id, form_id, pokemon_height, pokemon_weight) => {
  let weightRatio = 0, heightRatio = 0;
  if (form_id > 0 && !MAIN.masterfile.pokemon[pokemon_id].weight){
    weightRatio = pokemon_weight / MAIN.masterfile.pokemon[pokemon_id].forms[form_id].weight;
    heightRatio = pokemon_height / MAIN.masterfile.pokemon[pokemon_id].forms[form_id].height;
  } else {
    weightRatio = pokemon_weight / MAIN.masterfile.pokemon[pokemon_id].weight;
    heightRatio = pokemon_height / MAIN.masterfile.pokemon[pokemon_id].height;
  }

  let size = heightRatio + weightRatio;

  switch (true) {
    case size < 1.5: return 'tiny';
    case size <= 1.75: return 'small';
    case size < 2.25: return 'normal';
    case size <= 2.5: return 'large';
    default: return 'big';
  }
}

let savedRecipes = JSON.parse(localStorage.getItem("savedRecipes")) || [];

function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

function findCurrent() {
  return savedRecipes.find(r => r.name === localStorage.getItem("currentRecipeView"));
}

function viewDetails(name) {
  localStorage.setItem("currentRecipeView", name);
  window.location.href = "./basic_page.html";
}

let NewRecipeIngredientsCount = 1;
let NewRecipeInstructionsCount = 1;

function addField(type) {
  if (type === 'ing') {
    NewRecipeIngredientsCount++;
    $("#ing-area").append(`<input type="text" class="form-control mb-2 border-dark" id="add-recipe-form-ingredient${NewRecipeIngredientsCount}" placeholder="Ingredient ${NewRecipeIngredientsCount}">`);
  } else {
    NewRecipeInstructionsCount++;
    $("#ins-area").append(`<input type="text" class="form-control mb-2 border-dark" id="add-recipe-form-instruction${NewRecipeInstructionsCount}" placeholder="Step ${NewRecipeInstructionsCount}">`);
  }
}

async function processRecipe(isUpdate) {
  const name = document.getElementById("f-name").value;
  const category = document.getElementById("f-cat").value;
  const time = document.getElementById("f-time").value;
  const fileInput = document.getElementById("f-image");
  
  let ingredients = [];
  for (let i = 1; i <= NewRecipeIngredientsCount; i++) {
    let val = $(`#add-recipe-form-ingredient${i}`).val();
    if (val) ingredients.push(val);
  }

  let instructions = [];
  for (let i = 1; i <= NewRecipeInstructionsCount; i++) {
    let val = $(`#add-recipe-form-instruction${i}`).val();
    if (val) instructions.push(val);
  }

  let recipeData = {
    name: name,
    category: category,
    cook_time: time,
    ingredients: ingredients,
    instructions: instructions,
    favorite: $("#f-fav").is(":checked") ? "true" : "false",
    date_added: isUpdate ? findCurrent().date_added : Date.now()
  };

  if (fileInput && fileInput.files.length > 0) {
    recipeData.image_data = await getBase64(fileInput.files[0]);
  } else if (isUpdate) {
    recipeData.image_data = findCurrent().image_data;
  }

  if (isUpdate) {
    const idx = savedRecipes.findIndex(r => r.name === localStorage.getItem("currentRecipeView"));
    savedRecipes[idx] = recipeData;
  } else {
    savedRecipes.push(recipeData);
  }

  localStorage.setItem("savedRecipes", JSON.stringify(savedRecipes));
  window.location.href = "./index.html";
}

function ApplyFilters() {
  let query = $("#search-input").val().toLowerCase().trim();
  let category = $("#filter-category").val();
  let favOnly = $("#filter-favorites").is(":checked");
  let sortVal = $("#filter-sort").val();

  let results = savedRecipes.filter(recipe => {
    let searchable = recipe.name.toLowerCase();
    let matchSearch = query === "" || searchable.includes(query);
    let matchCategory = category === "" || recipe.category === category;
    let matchFav = !favOnly || recipe.favorite === "true";
    return matchSearch && matchCategory && matchFav;
  });

  if (sortVal === "name-asc") results.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortVal === "time-asc") results.sort((a, b) => parseInt(a.cook_time) - parseInt(b.cook_time));
  else results.sort((a, b) => b.date_added - a.date_added);

  renderRecipes(results);
}

function renderRecipes(list) {
  const dashboard = $("#recipe-dashboard");
  dashboard.empty();
  if (list.length === 0) {
    dashboard.append("<p class='text-center'>No recipes found.</p>");
    return;
  }

  list.forEach(recipe => {
    const img = recipe.image_data ? `<img src="${recipe.image_data}" class="card-img-top" style="height:160px; object-fit:cover;">` : `<div style="height:160px; background:#ddd;"></div>`;
    dashboard.append(`
      <div class="col-md-4 mb-4">
        <div class="card h-100 shadow-sm border-dark">
          <div class="recipe-title-bar">${recipe.name} ${recipe.favorite === "true" ? '<3' : ''}</div>
          ${img}
          <div class="card-body text-center">
            <p class="small fw-bold">${recipe.category} • ${recipe.cook_time} min</p>
            <button class="btn btn-custom-outline btn-sm w-100" onclick="viewDetails('${recipe.name}')">View recipe</button>
          </div>
        </div>
      </div>`);
  });
}

$(document).ready(function() {
  if ($("#recipe-dashboard").length) {
    ApplyFilters();
    $("#search-input").on("input", ApplyFilters);
    $("#filter-category, #filter-sort").on("change", ApplyFilters);
    $("#filter-favorites").on("change", ApplyFilters);
  }
});
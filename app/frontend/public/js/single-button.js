button=document.querySelector(".cart")
button.addEventListener('click', (event) => {
    let link = button.getAttribute('id');
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", `http://localhost:8080/addtocart/${link}`, true);
    xhttp.setRequestHeader("Content-type", "application/json");
    var button = event.target;
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
          // Process the response from the backend
          var response = JSON.parse(this.responseText);
          if(response.status == "ok")
          {
              button.textContent = "Added to Cart";
          }
          else{
              alert("Already added to cart");
          }
      }
  };
  xhttp.send();
  
  });

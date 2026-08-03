      var roomID = window.location.pathname.split("/")[1];
      document.getElementById('webappFrame').src = "/"+ roomID +"/app";
      document.getElementById('spreadsheetFrame').src = "/"+ roomID +"";
      document.getElementById('formdataFrame').src = "/"+ roomID +"_formdata/view";

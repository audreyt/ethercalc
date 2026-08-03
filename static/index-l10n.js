var readl10nfile = function(data) {
  for (var k in data) {
        SocialCalc.Constants[k] = data[k];
    }
}
$.ajax({url: ("./l10n/" + navigator.language + ".json").replace(/de-\w+/, 'de').replace(/zh-Hant/i, 'zh-TW').replace(/fr-\w+/, 'fr').replace(/en-\w+/, 'en'),
        async: false,
        success: function(data){readl10nfile(data)},
        error: function() {
          $.ajax({url: "./l10n/en.json",
                  async: false,
                  success: function(data){readl10nfile(data)},
                  error: function(){console.error("Language file not found.")}
          });
        }
  });


window.addEventListener('resize', function () {
  if (typeof window.doresize === 'function') window.doresize();
});

window.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('msgform');
  var input = document.getElementById('msgout');
  if (!form || !input) return;
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var value = input.value;
    if (!/\S/.test(value)) return;
    SocialCalc.Callbacks.broadcast('chat', {msg: value});
    addmsg(value, false);
    input.value = '';
  });
});
(function() {
  $().ready(function() {
    return $('body').append(templates.template({
      stooges: ['moe', 'larry', 'curly']
    }));
  });
}).call(this);

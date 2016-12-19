jQuery(document).ready(function() {
    setTimeout(function() {
        if(jQuery('#SocialCalc-graphtab')) {
            jQuery('#SocialCalc-edittools img[id]').addClass('btn btn-link btn-xs');

            jQuery('#SocialCalc-cellsettingstoolbar input[type!="checkbox"],'+
                   '#SocialCalc-settingsview input[type!="checkbox"],'+
                   '#SocialCalc-sorttools input[type!="checkbox"], #SocialCalc-sorttools select,'+
                   '#SocialCalc-commenttools input,'+
                   '#SocialCalc-namestools input[type!="checkbox"], #SocialCalc-namestools select,'+
                   '#SocialCalc-clipboardview input,'+
                   '#SocialCalc-graphtools input, #SocialCalc-graphtools select')
                .addClass('btn btn-default btn-xs');

            jQuery('#SocialCalc-commenttools textarea, #SocialCalc-clipboardview textarea').addClass('form-control');

            jQuery('#SocialCalc-formulafunctions').prev().addClass('form-control input-sm');
            jQuery('#searchbarinput').addClass('form-control input-sm');

            jQuery('#SocialCalc-settings-savecell, #SocialCalc-settings-savesheet, input[value="OK"], input[value="Live Form"]')
                .addClass('btn-primary btn btn-xs')
                .removeClass('btn-default');

            jQuery(window).trigger('resize');
        }
    }, 1000);
});

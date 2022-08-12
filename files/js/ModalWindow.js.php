<style id="WidgetCopypasteLeadsModal_Style">
#WidgetCopypasteLeads_Modal {
  width: 298px; height: 218px;
  padding: 18px 9px;
  border-radius: 4px;
  background: #fafafa;
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  margin: auto;
  display: none;
  opacity: 0;
  z-index: 10041;
  /* text-align: center; */
}
#WidgetCopypasteLeads_Modal #WidgetCopypasteLeads_Modal__close {
  width: 21px; height: 21px;
  position: absolute;
  font-size: 29px;
  top: 1px; right: 11px;
  cursor: pointer;
  display: block;
  
}
#WidgetCopypasteLeads_Overlay {
  z-index: 10040;
  position: fixed;
  background: rgba(0,0,0,.7);
  width: 100%; height: 100%;
  top: 0; left: 0;
  cursor: pointer;
  display: none;
}
#WidgetCopypasteLeads_Modal_Content{
  overflow: auto;
  height: 100%;
}
</style>
<script id="WidgetCopypasteLeadsModal_Script">
    function ShowMessage_WidgetCopypasteLeads(msg, width = 300, height= 70, align = "center"){
        WriteModal_WidgetCopypasteLeads();
        $('#WidgetCopypasteLeads_Modal').width(width + 'px');
        $('#WidgetCopypasteLeads_Modal').height(height + 'px');
        
        msg = '<br>' + msg + '<br>'+
        '<a href="#" onclick="$(\'#WidgetCopypasteLeads_Modal\').remove(); $(\'#WidgetCopypasteLeads_Overlay\').remove(); return false;" style="text-decoration: none;font-weight:bold;">OK</a>';
        msg = '<div align="'+align+'">' + msg + '</div>';
        $('#WidgetCopypasteLeads_Modal_Content_Body').html(msg);
    }

    function ShowDialog_WidgetCopypasteLeads(msg, function_ok){
        WriteModal_WidgetCopypasteLeads();
        $('#WidgetCopypasteLeads_Modal').width(300 + 'px');
        $('#WidgetCopypasteLeads_Modal').height(70 + 'px');
        
        msg = '<br>' + msg + '<br>'+
        '<a href="#" onclick="$(\'#WidgetCopypasteLeads_Modal\').remove(); $(\'#WidgetCopypasteLeads_Overlay\').remove(); return false;" style="text-decoration: none;font-weight:bold;">Отменить</a>&nbsp;&nbsp;&nbsp;&nbsp;'+
        '<a href="#" onclick="'+function_ok+' $(\'#WidgetCopypasteLeads_Modal\').remove(); $(\'#WidgetCopypasteLeads_Overlay\').remove(); return false;" style="text-decoration: none;font-weight:bold;">OK</a>';
        msg = '<div align="center">' + msg + '</div>';
        $('#WidgetCopypasteLeads_Modal_Content_Body').html(msg);
    }

    function WriteModal_WidgetCopypasteLeads(){
        $('#WidgetCopypasteLeads_Modal').remove();
        $('#WidgetCopypasteLeads_Overlay').remove();
        var html = '<div id="WidgetCopypasteLeads_Modal">\
        <div id="WidgetCopypasteLeads_Modal_Content"><div id="WidgetCopypasteLeads_Modal_Content_Body">Загрузка...</div></div>\
        <span id="WidgetCopypasteLeads_Modal__close" class="close" onclick="return false;">ₓ</span>\
        </div>\
        <div id="WidgetCopypasteLeads_Overlay"></div>';
        $('body').append(html);
        $('#WidgetCopypasteLeads_Modal__close, #WidgetCopypasteLeads_Overlay').on('click', function() {
            $(this).css('display', 'none');
            $('#WidgetCopypasteLeads_Overlay').fadeOut(296);
            $('#WidgetCopypasteLeads_Modal').remove();
            $('#WidgetCopypasteLeads_Overlay').remove();
        });

        $('#WidgetCopypasteLeads_Overlay').fadeIn(296,	function(){
            $('#WidgetCopypasteLeads_Modal, #WidgetCopypasteLeads_Overlay')
                .css('display', 'block')
                .animate({opacity: 1}, 198);

        });
    }
    
    var Url_WidgetCopypasteLeads = '<?php echo WEB_WIDGET_URL; ?>templates.php';
    $(document).ready(function() {});

    $(document).on('page:changed', function () {
        // сработает, когда пользователь перейдет на другую страницу
        if (AMOCRM.isCard()) {}
    });
</script>
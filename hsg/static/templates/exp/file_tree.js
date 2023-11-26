document.write("<script src='/static/vendor/btree.min.js'></script>");
function download_folder(path, zip_name){
    window.location.href=`/stream_compress?path=${encodeURIComponent(path)}&zip_name=${encodeURIComponent(zip_name)}`
}
function init_file_tree(data){
    $('#file-tree').bstreeview({
        data: data,
        indent: 1.25,
        parentsMarginLeft: '1.25rem',
        openNodeLinkOnNewTab: true
    });
    
    $('#file-viewer').css('max-width', $('#file-viewer').width()+'px')


    function check_is_image(filename) {
        return /\.(gif|jpe?g|tiff?|png|webp|bmp|dib|pbm|pgm|ppm|tif)$/i.test(filename);
    }
    $("[id^='file-node-']").click(function (e) {
        $("[id^='file-node-']").each((index, val) => {
            $(val).css('background', 'white')

        })

        $(e.currentTarget).css('background', 'gainsboro')
        let url = e.currentTarget.id.replace('file-node-', '')
        if (check_is_image(url)) {
            window.open(url + "?type=image")
            return
        }
        console.log(url)
        $.ajax({
            url: url + "?type=file",
            type: 'GET',
            dataType: 'text',
            success: function (response) {
                let code = document.createElement('code');
                let pre = document.getElementById('text-viewer')
                if (url.endsWith('.py')) {
                    code.className = 'language-python';
                } else if (url.endsWith('.yaml')) {
                    code.className = 'language-yaml';
                }
                else if (url.endsWith('.json')) {
                    code.className = 'language-json';
                }
                pre.textContent = '';
                pre.appendChild(code);
                code.textContent = response;
                Prism.highlightElement(code);
            },
            error: function (error) {
                console.log(error);
            }
        });
    })
}
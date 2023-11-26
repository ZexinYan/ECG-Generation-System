var PenSize = 2
var FabricOpacity = 0.9
var AnnotationList = []
var TextList = []
var LabelOffsetY = 16
var CurrentImageHtml = $("#image_" + CurrentIndex)
var CurrentImage = ImageList[CurrentIndex]
var comment_api_url = "/image_comment/api/v2/image_comment"
var painter_height = $(window).height() - $('nav').outerHeight(true) - $('.card-header').outerHeight(true)
$("#painter").attr("width", $("#painter").parent().width())
$("#painter").attr("height", painter_height)
$(".form-check").css("max-height", painter_height * 4 / 8 + 'px')
$(".form-check").css("min-height", painter_height * 4 / 8 + 'px')
$(".comment-list").css("max-height", painter_height * 3.3 / 8 + 'px')
$(".comment-list").css("min-height", painter_height * 3.3 / 8 + 'px')
$('.image-name-list').css('max-height', painter_height + 'px')
fabric.Image.prototype.needsItsOwnCache = function () {
    return true
}
fabric.initFilterBackend = function() {
    if (fabric.enableGLFiltering &&  fabric.isWebglSupported && fabric.isWebglSupported(fabric.textureSize)) {
        return (new fabric.WebglFilterBackend({ tileSize: fabric.textureSize }));
    }
    else if (fabric.Canvas2dFilterBackend) {
        return (new fabric.Canvas2dFilterBackend());
    }
};

fabric.Object.prototype.objectCaching = false;

var canvas = new fabric.Canvas('painter', {
    imageSmoothingEnabled: false,
    enableRetinaScaling: false,
    imageSmoothingQuality: 'high',
})
var moving = false

function init_painter() {

}

function bind_keyboard() {
    document.addEventListener('keydown', function (e) {
        e = window.event || e
        if (e.target.localName === 'input') {
            return
        }
        switch (e.keyCode) {
            case 82:
                canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
                break
            case 38:
                $("#image_" + CurrentIndex).blur()
                e.preventDefault()
                if (CurrentIndex == 0) {
                    break
                }
                CurrentIndex = CurrentIndex - 1
                change_image(CurrentIndex)
                break
            case 40:
                $("#image_" + CurrentIndex).blur()
                e.preventDefault()
                if (ImageList.length - 1 == CurrentIndex) {
                    break
                }
                CurrentIndex = CurrentIndex + 1
                change_image(CurrentIndex)
                break
            case 32:
                for (index in AnnotationList) {
                    AnnotationList[index].annotation.visible = false
                    if (AnnotationList[index].text != undefined) {
                        AnnotationList[index].text.visible = false
                    }
                }
                canvas.renderAll()
                e.preventDefault()
                break
            default:
                break
            }
        })
    document.body.onkeyup = function (e) {
        e = window.event || e
        if (e.target.localName === 'input') {
            return
        }
        switch (e.keyCode) {
            case 32:
                for (index in AnnotationList) {
                    let show_labels = $('#label-list').find('input').toArray().filter(item => item.checked).map(item => item.id)
                    if (show_labels.indexOf(AnnotationList[index].annotation.label) != -1) {
                        AnnotationList[index].annotation.visible = true
                        if (AnnotationList[index].text !== undefined) {
                            AnnotationList[index].text.visible = true
                        }
                    }
                }
                canvas.renderAll()
                break
            default:
                break
        }
    }
}

function bind_canvans() {
    $('#pen-slider').change(function (e) {
        PenSize = parseInt(e.target.value)
        for (index in AnnotationList) {
            if (AnnotationList[index].annotation.shape_type == 'point') {
                AnnotationList[index].annotation.radius = PenSize
            }
            else {
                AnnotationList[index].annotation.strokeWidth = PenSize
            }
        }
        canvas.renderAll()
    })

    $('#background-slider').change(function (e) {
        FabricOpacity = parseFloat(e.target.value)
        canvas.backgroundImage.opacity = FabricOpacity
        canvas.renderAll()
    })

    // canvas zoom
    document.addEventListener("mousewheel", (e) => {
        if (e.target.localName === 'canvas') {
            e.preventDefault()
        }
    }, { passive: false });

    canvas.on('mouse:wheel', function (opt) {
        let zoom = canvas.getZoom()
        zoom *= 0.999 ** opt.e.deltaY
        if (zoom < 0.01 || zoom > 100)
            return
        canvas.zoomToPoint(
            {
                x: opt.e.offsetX,
                y: opt.e.offsetY
            }, zoom)
    })

    canvas.on('mouse:down', function (e) {
        moving = true
        canvas.selection = false
    })

    canvas.on('mouse:up', function (e) {
        moving = false
        canvas.selection = true
    })

    canvas.on('mouse:move', function (e) {
        if (moving && e.e) {
            let delta = new fabric.Point(e.e.movementX, e.e.movementY)
            canvas.relativePan(delta)
        }
    })

    $('#is-origin').click(function (e) {
        let path = window.location.href
        let is_origin = new RegExp('(is_origin=)([^&]*)', 'gi')
        let data_subset_id = new RegExp('(data_subset_id=)([^&]*)', 'gi')
        let image_id = new RegExp('(image_id=)([^&]*)', 'gi')
        CurrentImage = ImageList[CurrentIndex]
        let new_path = path.replace(is_origin, 'is_origin=' + $('#is-origin').prop('checked'))
        new_path = new_path.replace(data_subset_id, 'data_subset_id=' + CurrentImage.data_subset_id).replace(image_id, 'image_id=' + CurrentImage.image_id)
        window.location.href = new_path
    })

    $('#quality-select').change(function (e) {
        let path = window.location.href
        let quality = new RegExp('(quality=)([^&]*)', 'gi')
        let data_subset_id = new RegExp('(data_subset_id=)([^&]*)', 'gi')
        let image_id = new RegExp('(image_id=)([^&]*)', 'gi')
        CurrentImage = ImageList[CurrentIndex]
        let new_path = path.replace(quality, 'quality=' + $('#quality-select').val())
        new_path = new_path.replace(data_subset_id, 'data_subset_id=' + CurrentImage.data_subset_id).replace(image_id, 'image_id=' + CurrentImage.image_id)
        window.location.href = new_path
    })
}

function share() {
    let path = window.location.href
    let image_id = new RegExp('(image_id=)([^&]*)', 'gi')
    let share_path = path.replace(image_id, `image_id=${CurrentImage.image_id}`)
    let data_subset_id = new RegExp('(data_subset_id=)([^&]*)', 'gi')
    share_path = share_path.replace(data_subset_id, `data_subset_id=${CurrentImage.data_subset_id}`)

    let textArea = document.createElement("textarea");
    textArea.value = share_path;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    swal("提示", "已成功复制图片分享链接", "success")
}

function load_comments() {
    $('.comment-list').html('')
    $.get({
        url: comment_api_url,
        data: {
            md5: CurrentImage.image_md5
        },
        dataType: 'json',
        success: function (comments) {
            let coments_html = ''
            for (index in comments) {
                let comment = comments[index]
                let delete_icon = ''
                if (CurrentUserName === comment.username) {
                    delete_icon = `<i onclick="delete_comment('${comment.ID}')"
                     style="float: right; line-height: unset;" class="fa fa-trash"></i>`
                }
                coments_html += `<a class="list-group-item list-group-item-action">
                        <p class='comment_username'>${comment.comment}</p>
                        <small>${comment.username} ${delete_icon}</small>
                        </a>`
            }
            $('.comment-list').html(coments_html)
        },
        error: function (e) {
            console.log(e)
        }
    })
}

function delete_comment(comment_id) {
    if (confirm("确认删除该评论吗") === true) {
        $.ajax({
            url: `${comment_api_url}/${comment_id}`,
            type: 'delete',
            success: function (result) {
                swal("提示", "删除成功", "success")
                load_comments()
            },
            error: function (e) {
                console.log(e)
            }
        })
    }
}

function add_comment() {
    let content = $('#comment_input').val()
    if (content === '') {
        swal("提示", "评论输入不能为空", "error")
        return
    }

    $.ajax({
        url: comment_api_url,
        data: {
            md5: CurrentImage.image_md5,
            comment: $('#comment_input').val(),
        },
        dataType: 'json',
        type: 'post',
        success: function (result) {
            load_comments()
            $('#comment_input').val('')
        },
        error: function (e) {
            console.log(e)
            $('#comment_input').val('')
        }
    })
}

function draw_label(label, dash_array = [0], dataset_name='', diff_type='') {
    let shape_type = label.shape_type
    let annotation;
    let left_top = label.points[0]
    let right_bottom = label.points[1]
    let color = LabelColorDict[label.label]

    // 避免重复添加
    let is_linestrip = false
    switch (shape_type) {
        case 'rectangle':
            annotation = new fabric.Rect({
                left: left_top.x,
                top: left_top.y,
                width: right_bottom.x - left_top.x,
                height: right_bottom.y - left_top.y,
                stroke: color,
                fill: 'transparent',
                strokeWidth: PenSize,
                selectable: false,
                label: label.label,
                shape_type: shape_type,
                diff_type: diff_type,
                dataset_name: dataset_name,
                strokeDashArray: dash_array,

            })
            left_top.y -= LabelOffsetY;
            break

        case 'polygon':
            annotation = new fabric.Polygon(label.points, {
                stroke: color,
                fill: 'transparent',
                strokeWidth: PenSize,
                selectable: false,
                label: label.label,
                shape_type: shape_type,
                diff_type: diff_type,
                dataset_name: dataset_name,
                strokeDashArray: dash_array,
            })
            break
        case 'mask':
            annotation = new fabric.Polygon(label.points, {
                stroke: color,
                fill: 'transparent',
                strokeWidth: PenSize,
                selectable: false,
                label: label.label,
                shape_type: shape_type,
                diff_type: diff_type,
                dataset_name: dataset_name,
                strokeDashArray: dash_array,

            })
            break
        case 'circle':
            let radius = Math.sqrt((right_bottom.x - left_top.x) * (right_bottom.x - left_top.x)
                + (right_bottom.y - left_top.y) * (right_bottom.y - left_top.y));
            annotation = new fabric.Circle({
                left: left_top.x - radius,
                top: left_top.y - radius,
                stroke: color,
                fill: 'transparent',
                radius: radius,
                selectable: false,
                strokeWidth: PenSize,
                label: label.label,
                shape_type: shape_type,
                diff_type: diff_type,
                dataset_name: dataset_name,
                strokeDashArray: dash_array,

            });
            left_top.y -= radius + LabelOffsetY;
            break

        case 'line':
            annotation = new fabric.Line(
                [left_top.x, left_top.y, right_bottom.x, right_bottom.y],
                {
                    stroke: color,
                    selectable: false,
                    strokeWidth: PenSize,
                    label: label.label,
                    shape_type: shape_type,
                    diff_type: diff_type,
                    dataset_name: dataset_name,
                    strokeDashArray: dash_array,

                });
            left_top.y -= LabelOffsetY;
            break

        case 'point':
            annotation = new fabric.Circle({
                left: left_top.x,
                top: left_top.y,
                stroke: color,
                fill: color,
                radius: 1,
                selectable: false,
                strokeWidth: PenSize,
                label: label.label,
                shape_type: shape_type,
                diff_type: diff_type,
                dataset_name: dataset_name,
                strokeDashArray: dash_array,

            });
            left_top.y -= LabelOffsetY + 5;
            break

        case 'linestrip':
            for (let line_index = 0; line_index < label.points.length - 1; line_index++) {
                annotation = new fabric.Line(
                    [label.points[line_index].x, label.points[line_index].y,
                    label.points[line_index + 1].x, label.points[line_index + 1].y],
                    {
                        stroke: color,
                        selectable: false,
                        strokeWidth: PenSize,
                        label: label.label,
                        shape_type: shape_type,
                        diff_type: diff_type,
                        dataset_name: dataset_name,
                        strokeDashArray: dash_array,

                    });
                canvas.add(annotation)
                AnnotationList.push({
                    annotation: annotation,
                    text: undefined,
                })
            }
            is_linestrip = true
            left_top.y -= LabelOffsetY;
            break

        default:
            console.log("Don't support the shape: ", label)
            break
    }

    let text = new fabric.Text(label.label, {
        left: left_top.x,
        top: left_top.y,
        fill: color,
        fontSize: 16,
        selectable: false
    })
    canvas.add(text)
    // 避免linestrip重复添加
    if (!is_linestrip) {
        canvas.add(annotation)
        AnnotationList.push({
            annotation: annotation,
            text: text,
        })
    } else {
        AnnotationList[AnnotationList.length - 1].text = text
    }
}
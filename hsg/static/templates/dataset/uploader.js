var UploadFiles = [];
var dropArea = document.getElementById("drop-area");

function dragHandler(event) {
    event.stopPropagation();
    event.preventDefault();
    dropArea.className = "area drag";
}

function filesDroped(event) {
    var processedFiles = [];
    event.stopPropagation();
    event.preventDefault();
    dropArea.className = "area";
    var imageCount = 0;

    function handleEntry(entry) {
        let file =
            "getAsEntry" in entry ? entry.getAsEntry() :
                "webkitGetAsEntry" in entry ? entry.webkitGetAsEntry()
                    : entry;
        return Promise.resolve(file);
    }

    function handleFile(entry) {
        return new Promise(function (resolve) {
            if (entry.isFile) {
                entry.file(function (file) {
                    listFile(file, entry.fullPath).then(resolve)
                })
            } else if (entry.isDirectory) {
                var reader = entry.createReader();
                reader.readEntries(webkitReadDirectories.bind(null, entry, handleFile, resolve))
            } else {
                var entries = [entry];
                return entries.reduce(function (promise, file) {
                    return promise.then(function () {
                        return listDirectory(file)
                    })
                }, Promise.resolve())
                    .then(function () {
                        return Promise.all(entries.map(function (file) {
                            return listFile(file)
                        })).then(resolve)
                    })
            }
        })

        function webkitReadDirectories(entry, callback, resolve, entries) {
            return listDirectory(entry).then(function (currentDirectory) {
                return entries.reduce(function (promise, directory) {
                    return promise.then(function () {
                        return callback(directory)
                    });
                }, Promise.resolve())
            }).then(resolve);
        }

    }

    function listDirectory(entry) {
        return Promise.resolve(entry);
    }

    function listFile(file, path) {
        path = path || file.webkitRelativePath || "/" + file.name;
        file = Object.defineProperty(file, 'webkitRelativePath', {
            value: path.substring(1),
        })
        
        let ext = path.split('.').pop().toLowerCase();
        if (['bmp', 'dib', 'png', 'jpg', 'jpeg', 'pbm', 'pgm', 'ppm', 'tif', 'tiff'].indexOf(ext) !== -1) {
            imageCount += 1
        }
        processedFiles.push(file);
        return Promise.resolve(processedFiles)
    };

    function processFiles(files) {
        Promise.all([].map.call(files, function (file, index) {
            return handleEntry(file, index).then(handleFile)
        }))
            .then(function () {
                console.log(processedFiles)
                $('#drop-area').attr("data-content-after",`已选择文件数: ${processedFiles.length}, 图片数: ${imageCount}` );
                UploadFiles = processedFiles
            })
            .catch(function (err) {
                console.log(err)
                swal("错误", err.message, "error")
            })
    }

    var files;

    if (event.type === "drop" && event.target.webkitdirectory) {
        files = event.dataTransfer.items || event.dataTransfer.files;
    } else if (event.type === "change") {
        files = event.target.files;
    }
    if (files) {
        processFiles(files)
    }

}
dropArea.addEventListener("dragover", dragHandler);
dropArea.addEventListener("change", filesDroped);
dropArea.addEventListener("drop", filesDroped);

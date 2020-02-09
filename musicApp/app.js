var artistBucketName = "florentinas-music-app";
var bucketRegion = "us-east-1";
// var AWS = require ('aws-sdk');
// var profile = "default";
var IdentityPoolId = "us-east-1:a13e5419-45f2-4aed-ac44-8d0cd3453ed0";

AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
  })
  // credentials: new AWS.SharedIniFileCredentials({
  //     profile: profile
  // })
});

var s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: artistBucketName }
});

function listArtists() {
  s3.listObjects({ Delimiter: "/" }, function(err, data) {
    if (err) {
      return alert("There was an error listing your artists: " + err.message);
    } else {
      var artists = data.CommonPrefixes.map(function(commonPrefix) {
        var prefix = commonPrefix.Prefix;
        var artistName = decodeURIComponent(prefix.replace("/", ""));
        return getHtml([
          "<li>",
          "<span onclick=\"deleteArtist('" + artistName + "')\">X</span>",
          "<span onclick=\"viewArtist('" + artistName + "')\">",
          artistName,
          "</span>",
          "</li>"
        ]);
      });
      var message = artists.length
        ? getHtml([
            "<p>Click on an artist name to view it.</p>",
            "<p>Click on the X to delete the artist.</p>"
          ])
        : "<p>You do not have any artists. Please Create artist.";
      var htmlTemplate = [
        "<h2>Artists</h2>",
        message,
        "<ul>",
        getHtml(artists),
        "</ul>",
        "<button onclick=\"createArtist(prompt('Enter Artist Name:'))\">",
        "Create New Artist",
        "</button>"
      ];
      document.getElementById("app").innerHTML = getHtml(htmlTemplate);
    }
  });
}

function createArtist(artistName) {
  artistName = artistName.trim();
  if (!artistName) {
    return alert("Artist names must contain at least one non-space character.");
  }
  if (artistName.indexOf("/") !== -1) {
    return alert("Artist names cannot contain slashes.");
  }
  var artistKey = encodeURIComponent(artistName) + "/";
  s3.headObject({ Key: artistKey }, function(err, data) {
    if (!err) {
      return alert("Artist already exists.");
    }
    if (err.code !== "NotFound") {
      return alert("There was an error creating your artist: " + err.message);
    }
    s3.putObject({ Key: artistKey }, function(err, data) {
      if (err) {
        return alert("There was an error creating your artist: " + err.message);
      }
      alert("Successfully created artist.");
      viewArtist(artistName);
    });
  });
}

// function viewArtist(artistName) {
//   var artistPhotosKey = encodeURIComponent(artistName) + "//";
//   s3.listObjects({ Prefix: artistPhotosKey }, function(err, data) {
//     if (err) {
//       return alert("There was an error viewing your artist: " + err.message);
//     }
//     // 'this' references the AWS.Response instance that represents the response
//     var href = this.request.httpRequest.endpoint.href;
//     var bucketUrl = href + artistBucketName + "/";

//     var photos = data.Contents.map(function(photo) {
//       var photoKey = photo.Key;
//       var photoUrl = bucketUrl + encodeURIComponent(photoKey);
//       return getHtml([
//         "<span>",
//         // "<div>",
//         // '<img style="width:128px;height:128px;" src="' + photoUrl + '"/>',
//         // "</div>",
//         // "<div>",
//         "<span onclick=\"deletePhoto('" +
//           artistName +
//           "','" +
//           photoKey +
//           "')\">",
//         "X",
//         "</span>",
//         "<span>",
//         photoKey.replace(artistPhotosKey, ""),
//         "</span>",
//         "</div>",
//         "</span>"
//       ]);
//     });
//     var message = photos.length
//       ? "<p>Click on the X to delete the photo</p>"
//       : "<p>You do not have any photos in this artist. Please add photos.</p>";
//     var htmlTemplate = [
//       "<h2>",
//       "Artist: " + artistName,
//       "</h2>",
//       message,
//       "<div>",
//       getHtml(photos),
//       "</div>",
//       '<input id="photoupload" type="file" webkitdirectory mozdirectory multiple>',
//       '<button id="addphoto" onclick="addPhoto(\'' + artistName + "')\">",
//       "Add Photo",
//       "</button>",
//       '<button onclick="listArtists()">',
//       "Back To Artists",
//       "</button>"
//     ];
//     document.getElementById("app").innerHTML = getHtml(htmlTemplate);
//   });
// }
function viewArtist(artistName) {
  var artistAlbumsKey = encodeURIComponent(artistName) + "/Albums/";
  s3.listObjects({ Prefix: artistAlbumsKey }, function(err, data) {
    if (err) {
      return alert("There was an error viewing your artist: " + err.message);
    }
    // 'this' references the AWS.Response instance that represents the response
    var href = this.request.httpRequest.endpoint.href;
    var bucketUrl = href + artistBucketName + "/";

    var albums = data.Contents.map(function(album) {
      console.log(album);
      var albumKey = album.Key;
      var albumUrl = bucketUrl + encodeURIComponent(albumKey);
      return getHtml([
        "<span>",
        // "<div>",
        // '<img style="width:128px;height:128px;" src="' + albumUrl + '"/>',
        // "</div>",
        "<div>",
        "<span onclick=\"deleteAlbum('" +
          artistName +
          "','" +
          albumKey +
          "')\">",
        "X",
        "</span>",
        "<span>",
        albumKey.replace(artistAlbumsKey, ""),
        "</span>",
        "</div>",
        "</span>"
      ]);
    });
    var message = albums.length
      ? "<p>Click on the X to delete the album</p>"
      : "<p>You do not have any albums in this artist. Please add albums.</p>";
    var htmlTemplate = [
      "<h2>",
      "Artist: " + artistName,
      "</h2>",
      message,
      "<div>",
      getHtml(albums),
      "</div>",
      '<input id="albumupload" type="file" webkitdirectory mozdirectory directory accept="audio/*">',
      '<button id="addalbum" onclick="addAlbum(\'' + artistName + "')\">",
      "Add Album",
      "</button>",
      '<button onclick="listArtists()">',
      "Back To Artists",
      "</button>"
    ];
    document.getElementById("app").innerHTML = getHtml(htmlTemplate);
  });
}

// function addPhoto(artistName) {
//   var files = document.getElementById("photoupload").files;
//   if (!files.length) {
//     return alert("Please choose a file to upload first.");
//   }
//   var file = files[0];
//   var fileName = file.name;
//   var artistPhotosKey = encodeURIComponent(artistName) + "//";

//   var photoKey = artistPhotosKey + fileName;

//   // Use S3 ManagedUpload class as it supports multipart uploads
//   var upload = new AWS.S3.ManagedUpload({
//     params: {
//       Bucket: artistBucketName,
//       Key: photoKey,
//       Body: file,
//       ACL: "public-read"
//     }
//   });

//   var promise = upload.promise();

//   promise.then(
//     function(data) {
//       alert("Successfully uploaded photo.");
//       viewArtist(artistName);
//     },
//     function(err) {
//       return alert("There was an error uploading your photo: ", err.message);
//     }
//   );
// }
function addAlbum(artistName) {
  var files = document.getElementById("albumupload").files;
  var artistAlbumsKey = encodeURIComponent(artistName) + "/Albums/";

  console.log(files);
  if (!files.length) {
    return alert("Please choose a file to upload first.");
  }

    var file = files[0];
    var fileName = file.name;
    

    var albumKey = artistAlbumsKey + fileName;

    // Use S3 ManagedUpload class as it supports multipart uploads
    var upload = new AWS.S3.ManagedUpload({
      params: {
        Bucket: artistBucketName,
        Key: albumKey,
        Body: file,
        ACL: "public-read"
      }
    });

    var promise = upload.promise();

    promise.then(
      function(data) {
        alert("Successfully uploaded album.");
        // viewArtist(artistName);
      },
      function(err) {
        return alert("There was an error uploading your album: ", err.message);
      }
    );
}

function deletePhoto(artistName, photoKey) {
  s3.deleteObject({ Key: photoKey }, function(err, data) {
    if (err) {
      return alert("There was an error deleting your photo: ", err.message);
    }
    alert("Successfully deleted photo.");
    viewArtist(artistName);
  });
}

function deleteArtist(artistName) {
  var artistKey = encodeURIComponent(artistName) + "/";
  s3.listObjects({ Prefix: artistKey }, function(err, data) {
    if (err) {
      return alert("There was an error deleting your artist: ", err.message);
    }
    var objects = data.Contents.map(function(object) {
      return { Key: object.Key };
    });
    s3.deleteObjects(
      {
        Delete: { Objects: objects, Quiet: true }
      },
      function(err, data) {
        if (err) {
          return alert("There was an error deleting your artist: ", err.message);
        }
        alert("Successfully deleted artist.");
        listArtists();
      }
    );
  });
}

import React, { useState, useEffect } from 'react'
import axios from 'axios';

import "../styles/main.css";
import {
  TableContainer,
  TableCaption,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  useToast,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  Select
} from '@chakra-ui/react'

const Main = (props) => {

  const instance = axios.create({ withCredentials: true, })

  const [token, setToken] = useState("");
  const [addAlbum, setAddAlbum] = useState({});
  const [selectAlbumID, setSelectAlbumID] = useState("");
  const [albumInfo, setAlbumInfo] = useState({});
  const [Albums, setAlbums] = useState([]);
  const [inputID, setInputID] = useState("");
  const [actions, setActions] = useState(0);
  const [completedEdit, setCompletedEdit] = useState(false);
  const [recentEdit, setRecentEdit] = useState({ addition: "", removal: "" });
  const [added, setAdded] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // get spotify api token
    axios('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(process.env.REACT_APP_ClientID + ':' + process.env.REACT_APP_ClientSecret)
      },
      data: 'grant_type=client_credentials'
    }).then(tokenResponse => {
      setToken(tokenResponse.data.access_token);
    }).catch((error) => {
      console.log("Error retrieving Spotify api token: " + error)
    });
  }, [])

  useEffect(() => {
    // get info of album to possibly be added.
    if (inputID) {
      axios(`https://api.spotify.com/v1/albums/${inputID}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      }).then(albumResponse => {
        setAddAlbum({
          albumID: inputID,
          albumName: albumResponse.data.name,
          albumArt: albumResponse.data.images[1].url,
          artists: `${albumResponse.data.artists.map((artist) => artist.name)}`,
          releaseYear: parseInt(albumResponse.data.release_date.slice(0, 4)),
          genres: `${albumResponse.data.genres.map((genre) => genre)}`
        });
      }).catch((error) => {
        console.log("Error retrieving album info from Spotify: " + error)
      });
    } else {
      setAddAlbum({})
    }
  }, [inputID])

  const tryAddAlbum = () => {
    // try to add the entered album into the database.
    if(addAlbum.albumID)
    {
      instance.post('http://localhost:5000/albums', addAlbum).then(() => {
        console.log("Album " + addAlbum.albumID + " successfully added to AlbumleDB.");
        setRecentEdit({ addition: addAlbum.albumID, removal: recentEdit.removal});
        setAdded(true);
        setCompletedEdit(true);
        setActions(actions => actions + 1);
        setInputID("");
        setAddAlbum({});
      }).catch((error) => {
        console.log("Error adding album: " + error.message);
        setInputID("");
        setAddAlbum({});
      })
    }
  }

  useEffect(() => {
    // get info of album to possibly be removed.
    if(selectAlbumID) {
      instance.get(`http://localhost:5000/albums?id=${selectAlbumID}`).then((albumResponse) => {
        setAlbumInfo({
          albumID: selectAlbumID,
          albumName: albumResponse.data.album.albumName,
          albumArt: albumResponse.data.album.albumArt,
          artists: albumResponse.data.album.artists,
          releaseYear: albumResponse.data.album.releaseYear,
          genres: albumResponse.data.album.genres
        })
      }).catch((error) => {
      console.log("Error retrieving album data: " + error.message);
    });
    } else {
      setAlbumInfo({})
    }
    
  }, [selectAlbumID])

  const tryRemoveAlbum = () => {
    // try to remove the selected album from the database.
    if(selectAlbumID)
    {
      console.log("Attempting to remove album " + selectAlbumID + "...");

      instance.delete(`http://localhost:5000/albums?id=${selectAlbumID}`).then(() => {
        console.log("Album with ID " + selectAlbumID + " successfully removed. ");
        setRecentEdit({ addition: recentEdit.addition, removal: selectAlbumID});
        setAdded(false);
        setCompletedEdit(true);
        setActions(actions => actions + 1);
        setSelectAlbumID("");
      }).catch((error) => {
        console.log("Error deleting album: " + error.message);
      });
    }
  }

  useEffect(() => {
    setAlbums([]);
    // get all of the albums from the database to be shown in our Select component later.
    axios.get('http://localhost:5000/albums/all').then((response) => {
      response.data.map((album) => {
        setAlbums((Albums) => [...Albums, { value: album.albumID, label: album.albumName, albumArt: album.albumArt, artists: album.artists, genres: album.genres, releaseYear: album.releaseYear }])
      })
      return { value: response.data.albumID, label: response.data.albumName}
    }).catch((error) => {
      console.log("Error retrieving albums: " + error.message);
    });
  }, [actions])

  useEffect(() => {
    setCompletedEdit(false);
  }, [completedEdit])

  return (
    <div className="main">
      <div className="title">
        EDIT ALBUMLEDB ALBUMS TABLE
      </div>
      <div className="subtitle">
        Add Album to AlbumleDB:
      </div>
      <div className="selection">
        <FormControl className="content" style={{width:"300px", display:"flex", flexDirection:"row"}}>
          <Input type='text' value={inputID} isRequired={true} placeholder="Spotify Album ID" onChange={(e) => {setInputID(e.target.value)}} />
          <Button
            ml="5"
            type='submit'
            bgColor="blue.500"
            color="white"
            _hover={{
              bg: "blue.600",
              color: "white"
            }}
            _active={{
              bg: "blue.600",
              color: "gray.200"
            }}
            onClick={() => {tryAddAlbum()}}
          >
            ADD
          </Button>
        </FormControl>
      </div>
      
      {/* Show info of album entered for addition */}
      {(addAlbum.albumID) ? 
        <div>
          <div className="subtitle">
            Game to be added to AlbumleDB:
          </div>
          <img src={(inputID) ? addAlbum.albumArt : ``} style={{marginTop:20}} />
          <div className="albumInfo">
            <div className="infoRow"><div className="infoHeader">Album ID:</div><div>{addAlbum.albumID}</div></div>
            <div className="infoRow"><div className="infoHeader">Album Name:</div><div>{addAlbum.albumName}</div></div>
            <div className="infoRow"><div className="infoHeader">Artist(s):</div><div>{addAlbum.artists}</div></div>
            <div className="infoRow"><div className="infoHeader">Release Year:</div><div>{addAlbum.releaseYear}</div></div>
            <div className="infoRow"><div className="infoHeader">Genre(s):</div><div>{addAlbum.genres}</div></div>
          </div> 
        </div> : <div/>
      }
      <div>
        <br />
      </div>

      <div className="subtitle">
        Remove Album from AlbumleDB:
      </div>
      <div className="selection">
        <Select placeholder='Select an Album to View and/or Remove...' bgColor='whiteAlpha.700' onChange={(e) => {setSelectAlbumID(e.target.value)}} >
          {Albums.map((items, index) => {
            return <option key={index} value={items.value}>{items.label}</option>
          })}
        </Select>
        <Button
          ml="5"
          type='submit'
          bgColor="red.500"
          color="white"
          _hover={{
            bg: "red.600",
            color: "white"
          }}
          _active={{
            bg: "red.600",
            color: "gray.200"
          }}
          onClick={() => {tryRemoveAlbum()}}
        >
          REMOVE
        </Button>
      </div>

      {/* Show info of album selected for removal */}
      {(albumInfo.albumID) ? 
        <div>
          <div className="subtitle">
            Game to be removed from AlbumleDB:
          </div>
          <img src={(selectAlbumID) ? `http://localhost:5000/albums/art?id=${selectAlbumID}&guessNum=6` : ``} style={{marginTop:20}} />
          <div className="albumInfo">
            <div className="infoRow"><div className="infoHeader">Album ID:</div><div>{albumInfo.albumID}</div></div>
            <div className="infoRow"><div className="infoHeader">Album Name:</div><div>{albumInfo.albumName}</div></div>
            <div className="infoRow"><div className="infoHeader">Artist(s):</div><div>{albumInfo.artists}</div></div>
            <div className="infoRow"><div className="infoHeader">Release Year:</div><div>{albumInfo.releaseYear}</div></div>
            <div className="infoRow"><div className="infoHeader">Genre(s):</div><div>{albumInfo.genres}</div></div>
          </div>
        </div> : <div/>
      }

      {/* Table to display all albums in AlbumleDB */}
      <TableContainer width={1200} outline={'3px solid white'} borderRadius='10px' m="50px 0px 50px 0px" bgColor="blackAlpha.500">
        <Table size='md'>
          <TableCaption placement='top' color='white' fontSize="20" margin="0" outline="1px solid white" > Albums in AlbumleDB </TableCaption>

          <Thead bgColor="blackAlpha.500">
            <Tr>
              <Th outline="1px solid white" color='white'>Album ID</Th>
              <Th outline="1px solid white" color='white'>Album Name</Th>
              <Th outline="1px solid white" color='white'>Artist</Th>
              <Th outline="1px solid white" color='white'>Genre(s)</Th>
              <Th outline="1px solid white" color='white' isNumeric>Release Year</Th>
            </Tr>
          </Thead>

          <Tbody>
            {Albums.map((item, index) =>
              <Tr key={index} bgColor= {(item.value === selectAlbumID) ? 'red.500' : (index % 2 === 1) ? 'blackAlpha.500' : ""}>
                <Td outline="1px solid white">
                  {item.value}
                </Td>
                <Td outline="1px solid white">
                  {item.label}
                </Td>
                <Td outline="1px solid white">
                  {item.artists}
                </Td>
                <Td outline="1px solid white">
                  {item.genres}
                </Td>
                <Td outline="1px solid white" isNumeric>
                  {item.releaseYear}
                </Td>
              </Tr>
            )}
          </Tbody>

          <Tfoot bgColor="blackAlpha.500">
            <Tr>
              <Th outline="1px solid white" color='white'>Album ID</Th>
              <Th outline="1px solid white" color='white'>Album Name</Th>
              <Th outline="1px solid white" color='white'>Artist</Th>
              <Th outline="1px solid white" color='white'>Genre(s)</Th>
              <Th outline="1px solid white" color='white' isNumeric>Release Year</Th>
            </Tr>
          </Tfoot>
        </Table>
      </TableContainer>
      {/* ALBUM ADDITION/REMOVAL TOAST NOTIFICATIONS */}
      {
        (completedEdit) ?
          (added) ?
            (!toast.isActive(' ')) ?
              toast({
                position: 'top',
                id: ' ',
                title: 'VICTORY',
                description: "Album " + recentEdit.addition + " successfully added to AlbumleDB.",
                status: 'success',
                duration: 5000,
                isClosable: false
              }) : "" :
            (!toast.isActive('')) ?
              toast({
                position: 'top',
                id: '',
                title: 'DEFEAT',
                description: "Album with ID " + recentEdit.removal + " successfully removed. ",
                status: 'error',
                duration: 5000,
                isClosable: false
              }) : "" :
          ""
      }
    </div>
  );
}

export default Main;
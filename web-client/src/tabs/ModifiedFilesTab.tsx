function ModifiedFilesTab() {
  const modifiedFiles = ["x.py", "y.py", "z.py"]
  return (
    <div>
    {modifiedFiles.map((file, index) => (
      <h3 style={{marginTop:-3,
                  border: "2px groove gray",
                  width: 400,
                  borderRadius: 10}}
          key={file}> &ensp;{index+1} &ensp;{file} </h3>
    ))}

      <hr></hr>

  </div>
  );
}

export default ModifiedFilesTab;

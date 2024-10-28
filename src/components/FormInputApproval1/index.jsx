import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const FormInputBerita = () => {
  const [inputs, setInputs] = useState({
    judul: "",
    deskripsi: "",
    tgl_posting: "",
    gambar: "",
    id_admin: "",
  });

  const handleInput = (value, key) => {
    const newInputs = { ...inputs };

    newInputs[key] = value;

    setInputs(newInputs);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  const handleReset = (e) => {
    e.preventDefault();
  };

  return (
    <section className="tambahberita mb-3 pb-3 mt-3 pt-3">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-10">
            <form onSubmit={handleSubmit} onReset={handleReset}>
              <div className="row mb-3">
                <label
                  htmlFor="input-judul-berita"
                  className="col-sm-2 col-form-label"
                >
                  Period
                </label>
                <div className="col-sm-10">
                  <input
                    type="text"
                    name="judul"
                    className="form-control"
                    id="input-judul-berita"
                    required
                    value={inputs.judul}
                    onChange={(e) => handleInput(e.target.value, e.target.name)}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <label htmlFor="deskripsi" className="col-sm-2 col-form-label">
                  Deskripsi
                </label>
                <div className="col-sm-10">
                  <textarea
                    name="deskripsi"
                    className="form-control"
                    id="deskripsi"
                    required
                    rows="5"
                    value={inputs.deskripsi}
                    onChange={(e) => handleInput(e.target.value, e.target.name)}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <label
                  htmlFor="input-tgl-posting"
                  className="col-sm-2 col-form-label"
                >
                  Tanggal Posting
                </label>
                <div className="col-sm-10">
                  <input
                    type="date"
                    name="tgl_posting"
                    className="form-control"
                    id="input-tgl-posting"
                    required
                    value={inputs.tgl_posting}
                    onChange={(e) => handleInput(e.target.value, e.target.name)}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-sm-2"></div>
                <div className="col-sm-10">
                  <button type="submit" className="btn btn-primary btn-simpan">
                    Simpan
                  </button>
                  <button
                    type="reset"
                    className="btn btn-danger ms-2 btn-batal"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FormInputBerita;

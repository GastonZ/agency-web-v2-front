import React from "react";
import { useModeration } from "../../../context/ModerationContext";
import { useNavigate } from "react-router-dom";
import OnlineLayout from "../../../layout/OnlineLayout";

const Moderation: React.FC = () => {
    const { data, setBasics } = useModeration();
    const navigate = useNavigate();

    console.log('Moderation data : ', data);

    return (
        <OnlineLayout>

            <div>
                <h2>Definición</h2>

                <input
                    placeholder="Nombre de la campaña"
                    value={data.name}
                    onChange={(e) => setBasics({ name: e.target.value })}
                />

                <input
                    placeholder="Objetivo principal"
                    value={data.goal}
                    onChange={(e) => setBasics({ goal: e.target.value })}
                />

                <textarea
                    placeholder="Descripción breve"
                    value={data.summary}
                    onChange={(e) => setBasics({ summary: e.target.value })}
                />

                {/* <button onClick={() => navigate("audience")}>Siguiente</button> */}
            </div>
        </OnlineLayout>
    );
};

export default Moderation;

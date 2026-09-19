package tjrs.dipred.orcamento.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "itens")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String codigo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descricao;

    private String unidade;

    @ManyToOne
    @JoinColumn(name = "subgrupo_id", nullable = false)
    private Subgrupo subgrupo;
}

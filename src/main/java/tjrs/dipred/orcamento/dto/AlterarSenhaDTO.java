package tjrs.dipred.orcamento.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlterarSenhaDTO {
    private String senhaAtual;
    private String novaSenha;
}
